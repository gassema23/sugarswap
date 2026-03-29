/**
 * useOnlineGame — wraps useGame + WebSocket sync for 2-player online mode.
 *
 * Protocol:
 *  • Host (playerIndex=0) calls initGame → sends initial state to server → relay to opponent.
 *  • After EVERY local action, the acting client sends the new state to the server.
 *  • The server relays it to the other client.
 *  • The receiving client calls setState() to replace its local state.
 *  • isHuman flags are re-mapped on receipt so each client sees itself as "human".
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState } from '../engine/types';
import { useGame } from './useGame';
import { initGame } from '../engine/gameEngine';

// ─── Config ───────────────────────────────────────────────────────────────────
const WS_URL = (import.meta as { env: Record<string, string> }).env.VITE_WS_URL
  ?? 'ws://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────
export type OnlineStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'       // room created, waiting for opponent
  | 'ready'         // opponent joined, host about to start game
  | 'playing'
  | 'opponent_disconnected'
  | 'error';

type ServerMsg =
  | { type: 'room_created';          code: string; playerIndex: 0 }
  | { type: 'room_joined';           code: string; playerIndex: 1; opponentName: string }
  | { type: 'opponent_joined';       opponentName: string }
  | { type: 'state_update';          state: GameState }
  | { type: 'opponent_disconnected' }
  | { type: 'error';                 message: string }
  | { type: 'pong' };

// ─── Helper: remap isHuman flags for the local player's perspective ───────────
function remapIsHuman(state: GameState, myIdx: number): GameState {
  return {
    ...state,
    players: state.players.map((p, i) => ({ ...p, isHuman: i === myIdx })),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useOnlineGame() {
  const {
    gameState, setState, startGame: _start,
    initialReveal: _initialReveal,
    drawDiscard: _drawDiscard,
    drawDeck: _drawDeck,
    discardCard: _discardCard,
    swapCard: _swapCard,
    revealCard: _revealCard,
    newRound: _newRound,
  } = useGame();

  const [status, setStatus]           = useState<OnlineStatus>('idle');
  const [roomCode, setRoomCode]       = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [myName, setMyName]           = useState('');

  const wsRef      = useRef<WebSocket | null>(null);
  const myIdxRef   = useRef<number | null>(null);   // stable ref for callbacks
  const codeRef    = useRef<string | null>(null);

  // ── Send helper ─────────────────────────────────────────────────────────────
  const wsSend = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  // ── Broadcast state after each local action ──────────────────────────────
  const broadcastState = useCallback((state: GameState) => {
    if (!codeRef.current) return;
    wsSend({ type: 'state_update', roomCode: codeRef.current, state });
  }, [wsSend]);

  // ── Connect to WS server ─────────────────────────────────────────────────
  const connect = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }
      setStatus('connecting');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => resolve(ws);
      ws.onerror = () => {
        setStatus('error');
        setErrorMsg('Impossible de se connecter au serveur.');
        reject(new Error('WS connect failed'));
      };

      ws.onmessage = (ev) => {
        let msg: ServerMsg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        if (msg.type === 'pong') return;

        if (msg.type === 'room_created') {
          myIdxRef.current = 0;
          codeRef.current  = msg.code;
          setPlayerIndex(0);
          setRoomCode(msg.code);
          setStatus('waiting');
        }

        if (msg.type === 'room_joined') {
          myIdxRef.current = 1;
          codeRef.current  = msg.code;
          setPlayerIndex(1);
          setRoomCode(msg.code);
          setOpponentName(msg.opponentName);
          setStatus('playing');
        }

        if (msg.type === 'opponent_joined') {
          setOpponentName(msg.opponentName);
          setStatus('ready'); // host will start the game
        }

        if (msg.type === 'state_update') {
          const myIdx = myIdxRef.current ?? 0;
          setState(remapIsHuman(msg.state, myIdx));
        }

        if (msg.type === 'opponent_disconnected') {
          setStatus('opponent_disconnected');
        }

        if (msg.type === 'error') {
          setErrorMsg(msg.message);
          setStatus('error');
        }
      };

      ws.onclose = () => {
        if (status === 'playing') setStatus('opponent_disconnected');
      };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Host: opponent just joined → auto-start game ──────────────────────────
  useEffect(() => {
    if (status !== 'ready' || myIdxRef.current !== 0 || !opponentName) return;
    // Small delay so the "opponent joined" UI flashes briefly
    const t = setTimeout(() => {
      const names = [myName, opponentName];
      const state = initGame(names);
      const mapped = remapIsHuman(state, 0);
      setState(mapped);
      broadcastState(mapped);
      setStatus('playing');
    }, 1200);
    return () => clearTimeout(t);
  }, [status, opponentName, myName, setState, broadcastState]);

  // ── Public actions — each applies locally then broadcasts ─────────────────

  const createRoom = useCallback(async (name: string) => {
    setMyName(name);
    setErrorMsg(null);
    try {
      await connect();
      wsSend({ type: 'create_room', playerName: name });
    } catch { /* error already set */ }
  }, [connect, wsSend]);

  const joinRoom = useCallback(async (code: string, name: string) => {
    setMyName(name);
    setErrorMsg(null);
    try {
      await connect();
      wsSend({ type: 'join_room', roomCode: code.toUpperCase(), playerName: name });
    } catch { /* error already set */ }
  }, [connect, wsSend]);

  // Wrap every game action: apply locally → broadcast
  function wrap<T extends unknown[]>(
    fn: (...args: T) => void,
    getState: () => GameState | null,
  ) {
    return (...args: T) => {
      fn(...args);
      // State update is async (React batching), so defer broadcast
      setTimeout(() => {
        const s = getState();
        if (s) broadcastState(s);
      }, 0);
    };
  }

  // We need the latest gameState in the broadcast — use a ref trick
  const gsRef = useRef<GameState | null>(gameState);
  gsRef.current = gameState;
  const getGs = () => gsRef.current;

  const initialReveal = useCallback(
    (pi: number, r: number, c: number) => wrap(_initialReveal, getGs)(pi, r, c),
    [_initialReveal, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const drawDiscard = useCallback(
    () => wrap(_drawDiscard, getGs)(),
    [_drawDiscard, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const drawDeck = useCallback(
    () => wrap(_drawDeck, getGs)(),
    [_drawDeck, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const discardCard = useCallback(
    () => wrap(_discardCard, getGs)(),
    [_discardCard, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const swapCard = useCallback(
    (r: number, c: number) => wrap(_swapCard, getGs)(r, c),
    [_swapCard, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const revealCard = useCallback(
    (r: number, c: number) => wrap(_revealCard, getGs)(r, c),
    [_revealCard, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const newRound = useCallback(
    () => wrap(_newRound, getGs)(),
    [_newRound, broadcastState], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
    setRoomCode(null);
    setPlayerIndex(null);
    setOpponentName(null);
    setErrorMsg(null);
  }, []);

  return {
    gameState,
    status,
    roomCode,
    playerIndex,
    opponentName,
    errorMsg,
    createRoom,
    joinRoom,
    initialReveal,
    drawDiscard,
    drawDeck,
    discardCard,
    swapCard,
    revealCard,
    newRound,
    disconnect,
  };
}
