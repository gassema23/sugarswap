/**
 * useRlAi — React hook that drives the expert AI using the backend ONNX model.
 *
 * Sends the current GameState as a 60-float observation to POST /api/ai/action,
 * decodes the response into a game-engine call, and applies it immediately.
 *
 * Falls back to the built-in TypeScript heuristic (aiTakeTurn) if the request
 * fails or the backend has no model loaded.
 */

import { useCallback, useRef } from 'react';
import type { GameState } from '../engine/types';
import {
  buildObservation,
  decodeAction,
  getValidActions,
  type RlAction,
} from '@/engine/rlObservation';
import {
  drawFromDiscard,
  drawFromDeck,
  discardDrawnCard,
  swapWithGrid,
  revealHiddenCard,
  initialRevealCard,
  aiTakeTurn,
} from '../engine/gameEngine';

type SetState = (s: GameState) => void;

/**
 * @param aiPlayerIndex  Index of the AI player in state.players (always 1 in vs-AI).
 * @param setState       Callback to commit the new game state.
 */
export function useRlAi(aiPlayerIndex: number, setState: SetState) {
  const pendingRef = useRef(false);   // prevent concurrent calls

  const takeTurn = useCallback(
    async (state: GameState): Promise<void> => {
      if (pendingRef.current) return;
      pendingRef.current = true;

      try {
        const obs    = buildObservation(state, aiPlayerIndex);
        const valid  = getValidActions(state, aiPlayerIndex);

        if (valid.length === 0) return;

        let action: number | null = null;

        // ── Try backend ONNX model ──────────────────────────────────────────
        try {
          const res = await fetch('/api/ai/action', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              observation:  Array.from(obs),
              validActions: valid,
            }),
            signal: AbortSignal.timeout(3000),   // 3 s timeout
          });

          if (res.ok) {
            const json = await res.json() as { action: number };
            if (valid.includes(json.action)) action = json.action;
          }
        } catch {
          // Network error or timeout — fall through to heuristic
        }

        // ── Apply action or fall back to TS heuristic ───────────────────────
        if (action !== null) {
          const decoded = decodeAction(action);
          const next = applyRlAction(state, aiPlayerIndex, decoded);
          setState(next);
        } else {
          // Fallback: built-in TS expert heuristic
          setState(aiTakeTurn(state, 'expert'));
        }
      } finally {
        pendingRef.current = false;
      }
    },
    [aiPlayerIndex, setState],
  );

  return { takeTurn };
}

// ─── Apply decoded action to game state ──────────────────────────────────────

function applyRlAction(
  state: GameState,
  aiPlayerIndex: number,
  action: RlAction,
): GameState {
  switch (action.type) {
    case 'draw_deck':    return drawFromDeck(state);
    case 'draw_discard': return drawFromDiscard(state);
    case 'discard':      return discardDrawnCard(state);
    case 'swap':         return swapWithGrid(state, action.row, action.col);
    case 'reveal': {
      if (state.phase === 'initial_reveal') {
        return initialRevealCard(state, aiPlayerIndex, action.row, action.col);
      }
      return revealHiddenCard(state, action.row, action.col);
    }
  }
}
