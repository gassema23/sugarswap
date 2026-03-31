/**
 * useOnlineGame — wraps useGame + WebSocket sync for 2–4 player online mode.
 *
 * Protocol:
 *  • Host (playerIndex=0) creates room → others join → host starts game.
 *  • After EVERY local action, the acting client sends the new state to the server.
 *  • The server relays it to all other clients in the room.
 *  • Each receiving client calls setState() to replace its local state.
 *  • isHuman flags are re-mapped on receipt so each client sees itself as "human".
 *
 * Auth integration:
 *  • If a JWT token is provided, it is sent in create_room / join_room so the
 *    server can associate the socket with a user account.
 *  • When the game ends (phase === 'game_over'), the host sends a game_over
 *    event so the server can persist stats for all authenticated players.
 *  • The server responds with progression_update events per authenticated player.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState } from '../engine/types';
import { useGame } from './useGame';
import { initGame } from '../engine/gameEngine';

// ─── Config ───────────────────────────────────────────────────────────────────

// Derive the WebSocket URL from the current page origin so this works in both
// dev (Vite proxies /ws → ws://localhost:3001/ws) and production (wss://domain/ws).
const WS_URL = (import.meta as { env: Record<string, string> }).env.VITE_WS_URL
  ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnlineStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'ready'
  | 'playing'
  | 'player_disconnected'
  | 'opponent_disconnected'
  | 'error';

export interface ProgressionUpdate {
  gainedXp:      number;
  newLevel:      number;
  levelUp:       boolean;
  newBadges:     string[];
  unlockedSkins: string[];
  jokers:        { peek: number; swap: number; freeze: number };
}

type ServerMsg =
  | { type: 'room_created';        code: string; playerIndex: 0; maxPlayers: number }
  | { type: 'room_joined';         code: string; playerIndex: number; players: string[]; maxPlayers: number }
  | { type: 'player_joined';       players: string[]; newPlayerName: string; newPlayerIndex: number }
  | { type: 'state_update';        state: GameState }
  | { type: 'player_disconnected'; playerIndex: number }
  | { type: 'opponent_disconnected' }
  | { type: 'progression_update' } & ProgressionUpdate
  | { type: 'error';               message: string }
  | { type: 'pong' };

// ─── Helper ───────────────────────────────────────────────────────────────────

function remapIsHuman(state: GameState, myIdx: number): GameState {
  return {
    ...state,
    players: state.players.map((p, i) => ({ ...p, isHuman: i === myIdx })),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnlineGame(token: string | null = null) {
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

  const [status, setStatus]             = useState<OnlineStatus>('idle');
  const [roomCode, setRoomCode]         = useState<string | null>(null);
  const [playerIndex, setPlayerIndex]   = useState<number | null>(null);
  const [players, setPlayers]           = useState<string[]>([]);
  const [maxPlayers, setMaxPlayers]     = useState<number>(2);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [myName, setMyName]             = useState('');
  const [progressionUpdate, setProgressionUpdate] = useState<ProgressionUpdate | null>(null);

  const wsRef           = useRef<WebSocket | null>(null);
  const myIdxRef        = useRef<number | null>(null);
  const codeRef         = useRef<string | null>(null);
  const maxPlayersRef   = useRef<number>(2);
  const statusRef       = useRef<OnlineStatus>('idle');
  const sentGameOverRef = useRef(false);
  statusRef.current     = status;

  // Keep token in a ref so callbacks always see the latest value
  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

  // ── Send helper ─────────────────────────────────────────────────────────────
  // The NestJS WsAdapter expects { event: "name", data: {...} }.
  // We keep the internal API as { type, ...rest } for readability and convert here.
  const wsSend = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    const { type, ...data } = msg;
    ws.send(JSON.stringify({ event: type, data }));
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
        setErrorMsg('Oups ! Le serveur fait la sieste — réessaie dans un instant. 🏝️');
        reject(new Error('WS connect failed'));
      };

      ws.onmessage = (ev) => {
        let msg: ServerMsg;
        try { msg = JSON.parse(ev.data as string); } catch { return; }

        if (msg.type === 'pong') return;

        if (msg.type === 'room_created') {
          myIdxRef.current      = 0;
          codeRef.current       = msg.code;
          maxPlayersRef.current = msg.maxPlayers;
          setPlayerIndex(0);
          setRoomCode(msg.code);
          setMaxPlayers(msg.maxPlayers);
          setPlayers([myName]);
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
          setStatus('waiting');
        }

        if (msg.type === 'player_joined') {
          setPlayers(msg.players);
          if (myIdxRef.current === 0 && msg.players.length === maxPlayersRef.current) {
            setStatus('ready');
          }
        }

        if (msg.type === 'state_update') {
          const myIdx = myIdxRef.current ?? 0;
          setState(remapIsHuman(msg.state, myIdx));
          if (statusRef.current !== 'playing') setStatus('playing');
        }

        if (msg.type === 'player_disconnected' || msg.type === 'opponent_disconnected') {
          setStatus('player_disconnected');
        }

        if (msg.type === 'progression_update') {
          const { type: _t, ...update } = msg;
          setProgressionUpdate(update as ProgressionUpdate);
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

  // ── Host: all players joined → auto-start ────────────────────────────────
  useEffect(() => {
    if (status !== 'ready' || myIdxRef.current !== 0) return;
    const t = setTimeout(() => {
      const state  = initGame(players);
      const mapped = remapIsHuman(state, 0);
      setState(mapped);
      broadcastState(mapped);
      setStatus('playing');
      sentGameOverRef.current = false;
    }, 1200);
    return () => clearTimeout(t);
  }, [status, players, setState, broadcastState]);

  // ── game_over: host sends event so server persists all players' stats ────
  useEffect(() => {
    if (!gameState || gameState.phase !== 'game_over') {
      sentGameOverRef.current = false;
      return;
    }
    // Only the host (player 0) sends the authoritative scores
    if (myIdxRef.current !== 0) return;
    if (sentGameOverRef.current) return;
    sentGameOverRef.current = true;

    const scores = gameState.players.map((p, i) => ({
      playerIndex: i,
      points: p.totalScore,
    }));
    wsSend({
      type:     'game_over',
      roomCode: codeRef.current,
      scores,
      token:    tokenRef.current,
    });
  }, [gameState?.phase, wsSend]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public actions ────────────────────────────────────────────────────────

  const createRoom = useCallback(async (name: string, max: number = 2) => {
    setMyName(name);
    setErrorMsg(null);
    maxPlayersRef.current = max;
    try {
      await connect();
      wsSend({ type: 'create_room', playerName: name, maxPlayers: max, token: tokenRef.current });
    } catch { /* error already set */ }
  }, [connect, wsSend]);

  const joinRoom = useCallback(async (code: string, name: string) => {
    setMyName(name);
    setErrorMsg(null);
    try {
      await connect();
      wsSend({ type: 'join_room', roomCode: code.toUpperCase(), playerName: name, token: tokenRef.current });
    } catch { /* error already set */ }
  }, [connect, wsSend]);

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
    setProgressionUpdate(null);
    sentGameOverRef.current = false;
  }, []);

  const clearProgressionUpdate = useCallback(() => setProgressionUpdate(null), []);

  const opponentName = players.find((_, i) => i !== (myIdxRef.current ?? 0)) ?? null;

  void _start;

  return {
    gameState,
    status,
    roomCode,
    playerIndex,
    players,
    maxPlayers,
    opponentName,
    errorMsg,
    progressionUpdate,
    clearProgressionUpdate,
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
