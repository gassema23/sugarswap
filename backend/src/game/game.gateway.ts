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

interface Room {
  code: string;
  sockets: WebSocket[];
  names: string[];
  userIds: (string | null)[]; // null = guest
  maxPlayers: number;
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
    console.log(`[${code}] player #${idx} disconnected`);
    this.relay(room, client, { type: 'player_disconnected', playerIndex: idx });
    this.rooms.delete(code);
    this.socketRoom.delete(client);
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
      sockets:    [client],
      names:      [data.playerName],
      userIds:    [userId],
      maxPlayers,
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
    if (room.sockets.length >= room.maxPlayers) {
      this.send(client, { type: 'error', message: 'Cette île est complète ! Rejoins une autre partie. 🏝️' });
      return;
    }

    const newPlayerIndex = room.sockets.length;
    const userId = this.extractUserId(data.token);

    room.sockets.push(client);
    room.names.push(data.playerName);
    room.userIds.push(userId);
    this.socketRoom.set(client, room.code);

    this.send(client, {
      type:        'room_joined',
      code:        room.code,
      playerIndex: newPlayerIndex,
      players:     room.names,
      maxPlayers:  room.maxPlayers,
    });

    for (let i = 0; i < newPlayerIndex; i++) {
      this.send(room.sockets[i], {
        type:           'player_joined',
        players:        room.names,
        newPlayerName:  data.playerName,
        newPlayerIndex,
      });
    }

    console.log(`[${room.code}] "${data.playerName}" joined (${room.sockets.length}/${room.maxPlayers})`);
  }

  // ─── state_update ──────────────────────────────────────────────────────────

  @SubscribeMessage('state_update')
  handleStateUpdate(
    @MessageBody() data: { roomCode: string; state: unknown },
    @ConnectedSocket() client: WebSocket,
  ) {
    const room = this.rooms.get(data.roomCode?.toUpperCase?.());
    if (!room) return;
    this.relay(room, client, { type: 'state_update', state: data.state });
  }

  // ─── game_over ─────────────────────────────────────────────────────────────
  /**
   * Expected payload:
   * {
   *   type: "game_over",
   *   roomCode: "ABC123",
   *   scores: [{ playerIndex: 0, points: 42 }, ...],
   *   token?: "JWT_TOKEN"   // optional — omit for guest players
   * }
   */
  @SubscribeMessage('game_over')
  async handleGameOver(
    @MessageBody() data: { roomCode: string; scores: PlayerScore[]; token?: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    const room = this.rooms.get(data.roomCode?.toUpperCase?.());
    if (!room) return;

    // Relay game-over event to all other players
    this.relay(room, client, { type: 'game_over', scores: data.scores });

    // Persist stats for every authenticated player in the room
    const isOnline = room.sockets.length > 1;
    await Promise.all(
      room.sockets.map(async (socket, idx) => {
        const userId = room.userIds[idx];
        if (!userId) return; // guest — skip persistence

        const playerScore = data.scores.find((s) => s.playerIndex === idx);
        if (!playerScore) return;

        try {
          const result = await this.progression.recordGameResult({
            userId,
            points: playerScore.points,
            isOnline,
          });

          // Notify the player of their progression update
          this.send(socket, {
            type:         'progression_update',
            gainedXp:     result.gainedXp,
            newLevel:     result.newLevel,
            levelUp:      result.levelUp,
            newBadges:    result.newBadges,
            unlockedSkins: result.unlockedSkins,
            jokers:       result.jokers,
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

  private relay(room: Room, sender: WebSocket, msg: object) {
    for (const ws of room.sockets) {
      if (ws !== sender) this.send(ws, msg);
    }
  }

  private genCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /** Decode JWT silently — returns userId or null if missing/invalid. */
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
