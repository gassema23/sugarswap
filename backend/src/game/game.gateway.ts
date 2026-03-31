import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { WebSocket } from 'ws';
import { ProgressionService } from '../progression/progression.service';

// ─── Types ────────────────────────────────────────────────────────────────────

const RECONNECT_GRACE_MS = 60_000;

interface Room {
  code: string;
  sockets: (WebSocket | null)[];
  names: string[];
  userIds: (string | null)[]; // null = guest
  maxPlayers: number;
  lastState: unknown | null;
  startedAt: Date | null;
  reconnectTimers: (ReturnType<typeof setTimeout> | null)[];
}

interface PlayerScore {
  playerIndex: number;
  points: number;
}

// ─── Gateway ─────────────────────────────────────────────────────────────────

/**
 * WebSocket gateway mounted at /ws.
 * Handles room management, state relay, and game-over persistence.
 * Protocol uses `{ type: "event_name", ...data }` messages (matched by
 * the SugarWsAdapter) for full frontend backward-compatibility.
 *
 * Reconnection: when a player disconnects mid-game, their slot is held for
 * RECONNECT_GRACE_MS (30s). If they reconnect and send rejoin_room within
 * that window, the game resumes from the last known state.
 */
@WebSocketGateway({ path: '/ws' })
export class GameGateway implements OnGatewayDisconnect {
  private readonly rooms      = new Map<string, Room>();
  private readonly socketRoom = new Map<WebSocket, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly progression: ProgressionService,
  ) {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  handleDisconnect(client: WebSocket) {
    const code = this.socketRoom.get(client);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;

    const idx = room.sockets.indexOf(client);
    if (idx === -1) return;

    this.socketRoom.delete(client);

    // If game hasn't started yet (no lastState), delete room immediately
    if (!room.lastState) {
      console.log(`[${code}] player #${idx} disconnected before game start — closing room`);
      this.relay(room, client, { type: 'player_disconnected', playerIndex: idx });
      this.rooms.delete(code);
      return;
    }

    // Mid-game: hold the slot for RECONNECT_GRACE_MS
    console.log(`[${code}] player #${idx} disconnected — holding slot for ${RECONNECT_GRACE_MS / 1000}s`);
    room.sockets[idx] = null;
    this.relay(room, client, { type: 'player_disconnected', playerIndex: idx });

    room.reconnectTimers[idx] = setTimeout(() => {
      console.log(`[${code}] player #${idx} reconnect window expired — closing room`);
      this.rooms.delete(code);
    }, RECONNECT_GRACE_MS);
  }

  // ─── ping ──────────────────────────────────────────────────────────────────

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: WebSocket) {
    this.send(client, { type: 'pong' });
  }

  // ─── create_room ───────────────────────────────────────────────────────────

  @SubscribeMessage('create_room')
  handleCreateRoom(
    @MessageBody() data: { playerName: string; maxPlayers?: number; token?: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    let code = this.genCode();
    while (this.rooms.has(code)) code = this.genCode();

    const maxPlayers = Math.min(Math.max(Number(data.maxPlayers ?? 2), 2), 8);
    const userId = this.extractUserId(data.token);

    const room: Room = {
      code,
      sockets:         [client],
      names:           [data.playerName],
      userIds:         [userId],
      maxPlayers,
      lastState:       null,
      startedAt:       null,
      reconnectTimers: [null],
    };

    this.rooms.set(code, room);
    this.socketRoom.set(client, code);

    this.send(client, { type: 'room_created', code, playerIndex: 0, maxPlayers });
    console.log(`[${code}] created by "${data.playerName}" (max ${maxPlayers})`);
  }

  // ─── join_room ─────────────────────────────────────────────────────────────

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { roomCode: string; playerName: string; token?: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    const room = this.rooms.get(data.roomCode?.toUpperCase?.());
    if (!room) {
      this.send(client, { type: 'error', message: 'Ce code ne mène nulle part… vérifie et réessaie ! 🍭' });
      return;
    }
    if (room.sockets.filter(Boolean).length >= room.maxPlayers) {
      this.send(client, { type: 'error', message: 'Cette île est complète ! Rejoins une autre partie. 🏝️' });
      return;
    }

    const newPlayerIndex = room.sockets.length;
    const userId = this.extractUserId(data.token);

    room.sockets.push(client);
    room.names.push(data.playerName);
    room.userIds.push(userId);
    room.reconnectTimers.push(null);
    this.socketRoom.set(client, room.code);

    this.send(client, {
      type:        'room_joined',
      code:        room.code,
      playerIndex: newPlayerIndex,
      players:     room.names,
      maxPlayers:  room.maxPlayers,
    });

    for (let i = 0; i < newPlayerIndex; i++) {
      const ws = room.sockets[i];
      if (ws) this.send(ws, {
        type:           'player_joined',
        players:        room.names,
        newPlayerName:  data.playerName,
        newPlayerIndex,
      });
    }

    console.log(`[${room.code}] "${data.playerName}" joined (${room.sockets.filter(Boolean).length}/${room.maxPlayers})`);
  }

  // ─── rejoin_room ───────────────────────────────────────────────────────────

  @SubscribeMessage('rejoin_room')
  handleRejoinRoom(
    @MessageBody() data: { roomCode: string; playerIndex: number; token?: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    const room = this.rooms.get(data.roomCode?.toUpperCase?.());
    if (!room || !room.lastState) {
      this.send(client, { type: 'error', message: 'La partie a expiré. Lance une nouvelle partie. 🍭' });
      return;
    }

    const idx = data.playerIndex;
    if (idx < 0 || idx >= room.sockets.length || room.sockets[idx] !== null) {
      this.send(client, { type: 'error', message: 'Ce slot n\'est pas disponible.' });
      return;
    }

    // Cancel the grace-period timer
    const timer = room.reconnectTimers[idx];
    if (timer) {
      clearTimeout(timer);
      room.reconnectTimers[idx] = null;
    }

    room.sockets[idx] = client;
    this.socketRoom.set(client, room.code);

    console.log(`[${room.code}] player #${idx} reconnected`);

    // Send current game state so the client can resume
    this.send(client, { type: 'state_update', state: room.lastState });
    this.relay(room, client, { type: 'player_reconnected', playerIndex: idx });
  }

  // ─── state_update ──────────────────────────────────────────────────────────

  @SubscribeMessage('state_update')
  handleStateUpdate(
    @MessageBody() data: { roomCode: string; state: unknown },
    @ConnectedSocket() client: WebSocket,
  ) {
    const room = this.rooms.get(data.roomCode?.toUpperCase?.());
    if (!room) return;
    if (!room.startedAt) room.startedAt = new Date();
    room.lastState = data.state;
    this.relay(room, client, { type: 'state_update', state: data.state });
  }

  // ─── game_over ─────────────────────────────────────────────────────────────

  @SubscribeMessage('game_over')
  async handleGameOver(
    @MessageBody() data: { roomCode: string; scores: PlayerScore[]; token?: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    const room = this.rooms.get(data.roomCode?.toUpperCase?.());
    if (!room) return;

    this.relay(room, client, { type: 'game_over', scores: data.scores });

    const isOnline = room.sockets.length > 1;
    await Promise.all(
      room.sockets.map(async (socket, idx) => {
        const userId = room.userIds[idx];
        if (!userId) return;

        const playerScore = data.scores.find((s) => s.playerIndex === idx);
        if (!playerScore) return;

        try {
          const endedAt = new Date();
          const result = await this.progression.recordGameResult({
            userId,
            points:     playerScore.points,
            isOnline,
            startedAt:  room.startedAt ?? endedAt,
            endedAt,
            allPlayers: room.sockets.map((_, i) => ({
              userId:   room.userIds[i] ?? null,
              name:     room.names[i],
              points:   data.scores.find((s) => s.playerIndex === i)?.points ?? 0,
              isAi:     false,
              isWinner: data.scores.reduce((min, s) => s.points < min.points ? s : min, data.scores[0]).playerIndex === i,
            })),
          });

          if (socket) this.send(socket, {
            type:          'progression_update',
            gainedXp:      result.gainedXp,
            newLevel:      result.newLevel,
            levelUp:       result.levelUp,
            newBadges:     result.newBadges,
            unlockedSkins: result.unlockedSkins,
            jokers:        result.jokers,
          });
        } catch (err) {
          console.error(`[game_over] progression error for user ${userId}:`, err);
        }
      }),
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private send(ws: WebSocket, msg: object) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  private relay(room: Room, sender: WebSocket | null, msg: object) {
    for (const ws of room.sockets) {
      if (ws && ws !== sender) this.send(ws, msg);
    }
  }

  private genCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private extractUserId(token?: string): string | null {
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      return payload.sub;
    } catch {
      return null;
    }
  }
}
