/**
 * Sugar Swap — WebSocket relay server
 *
 * Responsibilities:
 *  • Create rooms with a 6-char code
 *  • Join up to 2 players per room
 *  • Relay state/action messages between the two players
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
  | { type: 'create_room'; playerName: string }
  | { type: 'join_room';   roomCode: string; playerName: string }
  | { type: 'state_update'; roomCode: string; state: unknown }
  | { type: 'ping' };

interface Room {
  code:    string;
  sockets: WebSocket[];
  names:   string[];
}

// ─── State ────────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();
const socketRoom = new WeakMap<WebSocket, string>(); // socket → roomCode

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function send(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

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

      const room: Room = { code, sockets: [ws], names: [msg.playerName] };
      rooms.set(code, room);
      socketRoom.set(ws, code);

      send(ws, { type: 'room_created', code, playerIndex: 0 });
      console.log(`[${code}] created by "${msg.playerName}"`);
      return;
    }

    // ── join_room ─────────────────────────────────────────────────────────────
    if (msg.type === 'join_room') {
      const room = rooms.get(msg.roomCode.toUpperCase());
      if (!room) {
        send(ws, { type: 'error', message: 'Salon introuvable. Vérifie le code.' });
        return;
      }
      if (room.sockets.length >= 2) {
        send(ws, { type: 'error', message: 'Ce salon est déjà plein.' });
        return;
      }
      room.sockets.push(ws);
      room.names.push(msg.playerName);
      socketRoom.set(ws, msg.roomCode.toUpperCase());

      // Tell joiner
      send(ws, {
        type: 'room_joined',
        code: room.code,
        playerIndex: 1,
        opponentName: room.names[0],
      });
      // Tell host
      send(room.sockets[0], { type: 'opponent_joined', opponentName: msg.playerName });

      console.log(`[${room.code}] "${msg.playerName}" joined "${room.names[0]}"`);
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

    console.log(`[${code}] a player disconnected`);
    relay(room, ws, { type: 'opponent_disconnected' });
    rooms.delete(code);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Sugar Swap WS server → ws://localhost:${PORT}`);
});
