import { useCallback, useReducer } from 'react';
import type {
  GameState,
} from '../engine/types';
import {
  initGame,
  initialRevealCard,
  drawFromDiscard,
  drawFromDeck,
  discardDrawnCard,
  swapWithGrid,
  revealHiddenCard,
  startNewRound,
  aiTakeTurn,
} from '../engine/gameEngine';

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'INIT'; names: string[] }
  | { type: 'INITIAL_REVEAL'; playerIndex: number; row: number; col: number }
  | { type: 'DRAW_DISCARD' }
  | { type: 'DRAW_DECK' }
  | { type: 'DISCARD_DRAWN' }
  | { type: 'SWAP_GRID'; row: number; col: number }
  | { type: 'REVEAL_HIDDEN'; row: number; col: number }
  | { type: 'NEW_ROUND' }
  | { type: 'AI_TURN' }
  | { type: 'SET_STATE'; state: GameState }; // used by online mode to sync peer state

// ─── Reducer ─────────────────────────────────────────────────────────────────
function gameReducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === 'INIT')      return initGame(action.names);
  if (action.type === 'SET_STATE') return action.state;
  if (!state) return null;

  switch (action.type) {
    case 'INITIAL_REVEAL':
      return initialRevealCard(state, action.playerIndex, action.row, action.col);
    case 'DRAW_DISCARD':
      return drawFromDiscard(state);
    case 'DRAW_DECK':
      return drawFromDeck(state);
    case 'DISCARD_DRAWN':
      return discardDrawnCard(state);
    case 'SWAP_GRID':
      return swapWithGrid(state, action.row, action.col);
    case 'REVEAL_HIDDEN':
      return revealHiddenCard(state, action.row, action.col);
    case 'NEW_ROUND':
      return startNewRound(state);
    case 'AI_TURN':
      return aiTakeTurn(state);
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGame() {
  const [gameState, dispatch] = useReducer(gameReducer, null);

  const startGame = useCallback((names: string[]) => {
    dispatch({ type: 'INIT', names });
  }, []);

  const initialReveal = useCallback((playerIndex: number, row: number, col: number) => {
    dispatch({ type: 'INITIAL_REVEAL', playerIndex, row, col });
  }, []);

  const drawDiscard = useCallback(() => dispatch({ type: 'DRAW_DISCARD' }), []);
  const drawDeck    = useCallback(() => dispatch({ type: 'DRAW_DECK' }),    []);
  const discardCard = useCallback(() => dispatch({ type: 'DISCARD_DRAWN' }), []);

  const swapCard = useCallback((row: number, col: number) => {
    dispatch({ type: 'SWAP_GRID', row, col });
  }, []);

  const revealCard = useCallback((row: number, col: number) => {
    dispatch({ type: 'REVEAL_HIDDEN', row, col });
  }, []);

  const newRound = useCallback(() => dispatch({ type: 'NEW_ROUND' }), []);

  const aiTurn = useCallback(() => dispatch({ type: 'AI_TURN' }), []);

  const setState = useCallback((state: GameState) => {
    dispatch({ type: 'SET_STATE', state });
  }, []);

  return {
    gameState,
    startGame,
    initialReveal,
    drawDiscard,
    drawDeck,
    discardCard,
    swapCard,
    revealCard,
    newRound,
    aiTurn,
    setState,
  };
}
