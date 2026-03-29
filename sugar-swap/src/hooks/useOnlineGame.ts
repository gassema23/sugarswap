/**
 * useOnlineGame — wraps useGame + WebSocket sync for 2–4 player online mode.
 *
 * Protocol:
 *  • Host (playerIndex=0) creates room → others join → host starts game.
 *  • After EVERY local action, the acting client sends the new state to the server.
 *  • The server relays it to all other clients in the room.
 *  • Each receiving client calls setState() to replace its local state.
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
  | 'waiting'              // room created, waiting for more players
  | 'ready'                // all slots filled → host about to start
  | 'playing'
  | 'player_disconnected'
  | 'opponent_disconnected' // alias kept for legacy display
  | 'error';

type ServerMsg =
  | { type: 'room_created';        code: string; playerIndex: 0; maxPlayers: number }
  | { type: 'room_joined';         code: string; playerIndex: number; players: string[]; maxPlayers: number }
  | { type: 'player_joined';       players: string[]; newPlayerName: string; newPlayerIndex: number }
  | { type: 'state_update';        state: GameState }
  | { type: 'player_disconnected'; playerIndex: number }
  | { type: 'opponent_disconnected' }
  | { type: 'error';               message: string }
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

  const [status, setStatus]         = useState<OnlineStatus>('idle');
  const [roomCode, setRoomCode]     = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [players, setPlayers]       = useState<string[]>([]);   // all player names
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [myName, setMyName]         = useState('');

  const wsRef          = useRef<WebSocket | null>(null);
  const myIdxRef       = useRef<number | null>(null);  // stable ref for callbacks
  const codeRef        = useRef<string | null>(null);
  const maxPlayersRef  = useRef<number>(2);
  const statusRef      = useRef<OnlineStatus>('idle');
  statusRef.current    = status;

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
          myIdxRef.current     = 0;
          codeRef.current      = msg.code;
          maxPlayersRef.current = msg.maxPlayers;
          setPlayerIndex(0);
          setRoomCode(msg.code);
          setMaxPlayers(msg.maxPlayers);
          setPlayers([myName]);  // host is player 0
          setStatus('waiting');
        }

        if (msg.type === 'room_joined') {
          myIdxRef.current      = msg.playerIndex;
          codeRef.current       = msg.code;
          maxPlayersRef.current = msg.maxPlayers;
          setPlayerIndex(msg.playerIndex);
          setRoomCode(msg.code);
          setMaxPlayers(msg.maxPlayers);
          setPlayers(msg.players);
          // Non-host joiners wait in lobby until state_update arrives
          setStatus('waiting');
        }

        if (msg.type === 'player_joined') {
          setPlayers(msg.players);
          // Auto-start when room is full (host only)
          if (myIdxRef.current === 0 && msg.players.length === maxPlayersRef.current) {
            setStatus('ready');
          }
        }

        if (msg.type === 'state_update') {
          const myIdx = myIdxRef.current ?? 0;
          setState(remapIsHuman(msg.state, myIdx));
          // Transition all non-playing clients (joiners waiting for host to start)
          if (statusRef.current !== 'playing') setStatus('playing');
        }

        if (msg.type === 'player_disconnected' || msg.type === 'opponent_disconnected') {
          setStatus('player_disconnected');
        }

        if (msg.type === 'error') {
          setErrorMsg(msg.message);
          setStatus('error');
        }
      };

      ws.onclose = () => {
        if (statusRef.current === 'playing') setStatus('player_disconnected');
      };
    });
  }, [myName, setState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Host: all players joined → auto-start game ────────────────────────────
  useEffect(() => {
    if (status !== 'ready' || myIdxRef.current !== 0) return;
    const t = setTimeout(() => {
      const state  = initGame(players);
      const mapped = remapIsHuman(state, 0);
      setState(mapped);
      broadcastState(mapped);
      setStatus('playing');
    }, 1200);
    return () => clearTimeout(t);
  }, [status, players, setState, broadcastState]);

  // ── Public actions ────────────────────────────────────────────────────────

  const createRoom = useCallback(async (name: string, max: number = 2) => {
    setMyName(name);
    setErrorMsg(null);
    maxPlayersRef.current = max;
    try {
      await connect();
      wsSend({ type: 'create_room', playerName: name, maxPlayers: max });
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

  /** Host manually starts the game (when ≥ 2 players but room not yet full). */
  const startOnlineGame = useCallback(() => {
    if (myIdxRef.current !== 0) return;
    setStatus('ready');
  }, []);

  // ── Wrap every game action: apply locally → broadcast ────────────────────
  function wrap<T extends unknown[]>(
    fn: (...args: T) => void,
    getState: () => GameState | null,
  ) {
    return (...args: T) => {
      fn(...args);
      setTimeout(() => {
        const s = getState();
        if (s) broadcastState(s);
      }, 0);
    };
  }

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
    setPlayers([]);
    setMaxPlayers(2);
    setErrorMsg(null);
  }, []);

  // Backward-compat: first opponent name for simple 2-player displays
  const opponentName = players.find((_, i) => i !== (myIdxRef.current ?? 0)) ?? null;

  void _start; // unused in online mode

  return {
    gameState,
    status,
    roomCode,
    playerIndex,
    players,
    maxPlayers,
    opponentName,
    errorMsg,
    createRoom,
    joinRoom,
    startOnlineGame,
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
