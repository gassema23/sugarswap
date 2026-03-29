/**
 * Sugar Swap — WebSocket relay server
 *
 * Responsibilities:
 *  • Create rooms with a 6-char code (2–4 players)
 *  • Relay state/action messages between all players in a room
 *  • Clean up rooms on disconnect
 *
 * The server is intentionally game-logic-free:
 * the engine lives on the client and each client validates
 * its own actions. A full server-authoritative version would
 * run the engine here (future work for the RL AI).
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const PORT = Number(process.env.PORT ?? 3001);
const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Sugar Swap server OK');
});
const wss = new WebSocketServer({ server: httpServer });

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientMsg =
  | { type: 'create_room'; playerName: string; maxPlayers?: number }
  | { type: 'join_room';   roomCode: string; playerName: string }
  | { type: 'state_update'; roomCode: string; state: unknown }
  | { type: 'ping' };

interface Room {
  code:       string;
  sockets:    WebSocket[];
  names:      string[];
  maxPlayers: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

const rooms      = new Map<string, Room>();
const socketRoom = new WeakMap<WebSocket, string>(); // socket → roomCode

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function send(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

/** Relay a message to every socket in the room except the sender. */
function relay(room: Room, sender: WebSocket, msg: object) {
  for (const ws of room.sockets) {
    if (ws !== sender) send(ws, msg);
  }
}

// ─── Connection handler ───────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg: ClientMsg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return; }

    if (msg.type === 'ping') { send(ws, { type: 'pong' }); return; }

    // ── create_room ───────────────────────────────────────────────────────────
    if (msg.type === 'create_room') {
      let code = genCode();
      while (rooms.has(code)) code = genCode();

      const maxPlayers = Math.min(Math.max(Number(msg.maxPlayers ?? 2), 2), 8);
      const room: Room = { code, sockets: [ws], names: [msg.playerName], maxPlayers };
      rooms.set(code, room);
      socketRoom.set(ws, code);

      send(ws, { type: 'room_created', code, playerIndex: 0, maxPlayers });
      console.log(`[${code}] created by "${msg.playerName}" (max ${maxPlayers} players)`);
      return;
    }

    // ── join_room ─────────────────────────────────────────────────────────────
    if (msg.type === 'join_room') {
      const room = rooms.get(msg.roomCode.toUpperCase());
      if (!room) {
        send(ws, { type: 'error', message: 'Salon introuvable. Vérifie le code.' });
        return;
      }
      if (room.sockets.length >= room.maxPlayers) {
        send(ws, { type: 'error', message: 'Ce salon est déjà plein.' });
        return;
      }

      const newPlayerIndex = room.sockets.length;
      room.sockets.push(ws);
      room.names.push(msg.playerName);
      socketRoom.set(ws, msg.roomCode.toUpperCase());

      // Tell the joiner: their index + all current player names
      send(ws, {
        type:        'room_joined',
        code:        room.code,
        playerIndex: newPlayerIndex,
        players:     room.names,
        maxPlayers:  room.maxPlayers,
      });

      // Tell every existing player in the room
      for (let i = 0; i < newPlayerIndex; i++) {
        send(room.sockets[i], {
          type:           'player_joined',
          players:        room.names,
          newPlayerName:  msg.playerName,
          newPlayerIndex,
        });
      }

      console.log(`[${room.code}] "${msg.playerName}" joined (${room.sockets.length}/${room.maxPlayers})`);
      return;
    }

    // ── state_update ─────────────────────────────────────────────────────────
    if (msg.type === 'state_update') {
      const room = rooms.get(msg.roomCode?.toUpperCase?.());
      if (!room) return;
      relay(room, ws, { type: 'state_update', state: msg.state });
    }
  });

  ws.on('close', () => {
    const code = socketRoom.get(ws);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const idx = room.sockets.indexOf(ws);
    console.log(`[${code}] player #${idx} disconnected`);
    relay(room, ws, { type: 'player_disconnected', playerIndex: idx });
    rooms.delete(code);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Sugar Swap WS server → ws://localhost:${PORT}`);
});
