/**
 * rlObservation.ts — Build the 60-float observation vector from a GameState.
 *
 * This MUST stay in sync with SugarSwapEnv._obs() in gameai/sugar_swap_env.py.
 *
 * Sentinels:
 *   HIDDEN = -99   → face-down card (value unknown)
 *   EMPTY  = -98   → eliminated slot
 */

import type { GameState } from './types';

export const HIDDEN = -99;
export const EMPTY  = -98;

// Action space constants (mirror sugar_swap_env.py)
export const ACT_DRAW_DECK    = 0;
export const ACT_DRAW_DISCARD = 1;
export const ACT_SWAP_START   = 2;   // 2–13
export const ACT_DISCARD_CARD = 14;
export const ACT_REVEAL_START = 15;  // 15–26

const ROWS = 3;
const COLS = 4;
const N_CELLS = 12;

const PHASE_ENC: Record<string, number> = {
  initial_reveal: 0, playing: 1, last_round: 2, round_end: 3, game_over: 4,
};
const TPHASE_ENC: Record<string, number> = {
  draw: 0, discard_or_swap: 1, reveal_hidden: 2,
};

/**
 * Build the flat 60-float observation vector for the RL model.
 * `agentIndex` is always 0 in a vs-AI game (human = player 0 in the env,
 * but here the **AI is player 1** in the game engine, so we flip).
 *
 * Convention: the RL agent was trained as player 0 of the env.
 * In a vs-AI game the AI plays as player 1 of the game engine (index 1).
 * So we pass `aiPlayerIndex=1` and build the obs from its perspective.
 */
export function buildObservation(state: GameState, aiPlayerIndex: number): Float32Array {
  const obs = new Float32Array(60);

  const agent = state.players[aiPlayerIndex];
  const opp   = state.players[aiPlayerIndex === 0 ? 1 : 0];

  // [0:12]  Agent grid values  |  [12:24] Agent revealed flags
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const pos  = r * COLS + c;
      const card = agent.grid[r][c];
      if (card === null) {
        obs[pos]      = EMPTY;
        obs[12 + pos] = 0;
      } else if (!card.isRevealed) {
        obs[pos]      = HIDDEN;
        obs[12 + pos] = 0;
      } else {
        obs[pos]      = card.value;
        obs[12 + pos] = 1;
      }
    }
  }

  // [24:36] Opponent visible values  |  [36:48] Opponent revealed flags
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const pos  = r * COLS + c;
      const card = opp.grid[r][c];
      if (card === null) {
        obs[24 + pos] = EMPTY;
        obs[36 + pos] = 0;
      } else if (!card.isRevealed) {
        obs[24 + pos] = HIDDEN;
        obs[36 + pos] = 0;
      } else {
        obs[24 + pos] = card.value;
        obs[36 + pos] = 1;
      }
    }
  }

  // [48] Top of discard
  const topDiscard = state.discardPile[state.discardPile.length - 1];
  obs[48] = topDiscard ? topDiscard.value : EMPTY;

  // [49] Drawn card
  obs[49] = state.drawnCard ? state.drawnCard.value : HIDDEN;

  // [50] Phase  [51] Turn phase
  obs[50] = PHASE_ENC[state.phase]  ?? 0;
  obs[51] = TPHASE_ENC[state.turnPhase] ?? 0;

  // [52] Agent total score  [53] Opponent total score
  obs[52] = agent.totalScore;
  obs[53] = opp.totalScore;

  // [54] Agent hidden count (normalised)
  const agentHidden = agent.grid.flat().filter(c => c !== null && !c!.isRevealed).length;
  obs[54] = agentHidden / N_CELLS;

  // [55] Opponent hidden count (normalised)
  const oppHidden = opp.grid.flat().filter(c => c !== null && !c!.isRevealed).length;
  obs[55] = oppHidden / N_CELLS;

  // [56] Deck remaining (normalised)
  obs[56] = state.deck.length / 150;

  // [57] Drew-from-discard flag — not stored in GameState,
  //      so we infer: if turnPhase === 'discard_or_swap' and drawnCard exists
  //      we cannot know for sure from state alone; set to 0 (conservative).
  obs[57] = 0;

  // [58] Round number (normalised)
  obs[58] = state.roundNumber / 10;

  // [59] Score advantage (opp − agent, clipped)
  obs[59] = Math.max(-100, Math.min(100, opp.totalScore - agent.totalScore));

  return obs;
}

/**
 * Compute the set of legal action indices for the AI player.
 * Mirrors SugarSwapEnv._valid_actions() exactly.
 */
export function getValidActions(state: GameState, aiPlayerIndex: number): number[] {
  const valid: number[] = [];
  const player = state.players[aiPlayerIndex];

  if (state.phase === 'initial_reveal') {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const card = player.grid[r][c];
        if (card && !card.isRevealed) valid.push(ACT_REVEAL_START + r * COLS + c);
      }
    }
    return valid;
  }

  if (state.phase !== 'playing' && state.phase !== 'last_round') return valid;

  if (state.turnPhase === 'draw') {
    valid.push(ACT_DRAW_DECK);
    if (state.discardPile.length > 0) valid.push(ACT_DRAW_DISCARD);
  } else if (state.turnPhase === 'discard_or_swap') {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (player.grid[r][c] !== null) valid.push(ACT_SWAP_START + r * COLS + c);
      }
    }
    // Can only discard if drew from deck — we expose the action always;
    // the engine enforces it (UI hides it when drew from discard)
    valid.push(ACT_DISCARD_CARD);
  } else if (state.turnPhase === 'reveal_hidden') {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const card = player.grid[r][c];
        if (card && !card.isRevealed) valid.push(ACT_REVEAL_START + r * COLS + c);
      }
    }
  }

  return valid;
}

/**
 * Convert a raw action index back into engine calls.
 * Returns an object describing what to do next.
 */
export type RlAction =
  | { type: 'draw_deck' }
  | { type: 'draw_discard' }
  | { type: 'swap';   row: number; col: number }
  | { type: 'discard' }
  | { type: 'reveal'; row: number; col: number };

export function decodeAction(action: number): RlAction {
  if (action === ACT_DRAW_DECK)    return { type: 'draw_deck' };
  if (action === ACT_DRAW_DISCARD) return { type: 'draw_discard' };
  if (action === ACT_DISCARD_CARD) return { type: 'discard' };
  if (action >= ACT_SWAP_START && action < ACT_DISCARD_CARD) {
    const pos = action - ACT_SWAP_START;
    return { type: 'swap', row: Math.floor(pos / COLS), col: pos % COLS };
  }
  if (action >= ACT_REVEAL_START) {
    const pos = action - ACT_REVEAL_START;
    return { type: 'reveal', row: Math.floor(pos / COLS), col: pos % COLS };
  }
  return { type: 'draw_deck' };   // fallback
}
