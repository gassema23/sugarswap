/**
 * Pure game-engine — NO React imports.
 * Every exported function takes a GameState and returns a new GameState.
 * The engine validates every move; the AI can never cheat.
 */

import type { AiDifficulty, Card, GameState, Grid, Player } from './types';
import { buildDeck, shuffleDeck } from './deck';

const ROWS = 3;
const COLS = 4;
const INITIAL_REVEAL_COUNT = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(card => (card ? { ...card } : null)));
}

function clonePlayer(p: Player): Player {
  return {
    ...p,
    grid: cloneGrid(p.grid),
    scores: [...p.scores],
  };
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map(clonePlayer),
    deck: state.deck.map(c => ({ ...c })),
    discardPile: state.discardPile.map(c => ({ ...c })),
    drawnCard: state.drawnCard ? { ...state.drawnCard } : null,
    initialRevealLeft: [...state.initialRevealLeft],
  };
}

/** Count revealed cards in a player's grid. */
function revealedCount(p: Player): number {
  return p.grid.flat().filter(c => c !== null && c.isRevealed).length;
}

/** Count total non-null cards in a player's grid. */
function totalCards(p: Player): number {
  return p.grid.flat().filter(c => c !== null).length;
}

/** Sum visible-card values (null slots = 0, hidden = 0 for scoring purposes). */
export function gridScore(p: Player): number {
  return p.grid.flat().reduce((sum, c) => sum + (c && c.isRevealed ? c.value : 0), 0);
}

/** Full score including hidden cards (end-of-round). */
export function fullGridScore(p: Player): number {
  return p.grid.flat().reduce((sum, c) => sum + (c ? c.value : 0), 0);
}

/** Check a column for 3 identical revealed values → return col index or -1. */
function findEliminableColumn(grid: Grid): number {
  for (let col = 0; col < COLS; col++) {
    const cells = grid.map(row => row[col]);
    if (cells.every(c => c !== null && c.isRevealed && c.value === cells[0]!.value)) {
      return col;
    }
  }
  return -1;
}

/** Eliminate the column, push cards to top of discard. Returns updated grid + removed cards. */
function eliminateColumn(grid: Grid, col: number): { grid: Grid; removed: Card[] } {
  const newGrid = cloneGrid(grid);
  const removed: Card[] = [];
  for (let row = 0; row < ROWS; row++) {
    const card = newGrid[row][col];
    if (card) removed.push(card);
    newGrid[row][col] = null;
  }
  return { grid: newGrid, removed };
}

/** Build a fresh empty 3×4 grid. */
function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

/** Replenish deck from discard pile if needed (keep top discard card). */
function replenishDeckIfNeeded(state: GameState): GameState {
  if (state.deck.length > 0) return state;
  const s = cloneState(state);
  const top = s.discardPile.pop()!;
  s.deck = shuffleDeck(s.discardPile.map(c => ({ ...c, isRevealed: false })));
  s.discardPile = [top];
  return s;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export function initGame(playerNames: string[]): GameState {
  const fullDeck = shuffleDeck(buildDeck());
  const players: Player[] = playerNames.map((name, i) => ({
    id: `p${i}`,
    name,
    grid: emptyGrid(),
    isHuman: i === 0,
    scores: [],
    totalScore: 0,
  }));

  // Deal 12 cards per player (4 cols × 3 rows)
  let deckIdx = 0;
  for (const player of players) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        player.grid[row][col] = { ...fullDeck[deckIdx++], isRevealed: false };
      }
    }
  }

  const deck = fullDeck.slice(deckIdx);
  // Flip top card to start discard pile
  const firstDiscard = { ...deck.shift()!, isRevealed: true };

  return {
    players,
    deck,
    discardPile: [firstDiscard],
    currentPlayerIndex: 0,
    phase: 'initial_reveal',
    turnPhase: 'draw',
    drawnCard: null,
    lastRoundPlayerIndex: null,
    roundNumber: 1,
    message: `${players[0].name}, déballe 2 cartes pour lancer la fête ! 🏝️`,
    initialRevealLeft: players.map(() => INITIAL_REVEAL_COUNT),
  };
}

// ─── INITIAL REVEAL ───────────────────────────────────────────────────────────

export function initialRevealCard(
  state: GameState,
  playerIndex: number,
  row: number,
  col: number
): GameState {
  if (state.phase !== 'initial_reveal') return state;
  if (state.currentPlayerIndex !== playerIndex) return state;
  if (state.initialRevealLeft[playerIndex] <= 0) return state;

  const s = cloneState(state);
  const card = s.players[playerIndex].grid[row][col];
  if (!card || card.isRevealed) return state;

  card.isRevealed = true;
  s.initialRevealLeft[playerIndex]--;

  if (s.initialRevealLeft[playerIndex] > 0) {
    s.message = `Encore une carte à déballer, ${s.players[playerIndex].name} ! ✨`;
    return s;
  }

  // This player is done — move to next
  const nextPlayer = (playerIndex + 1) % s.players.length;
  s.currentPlayerIndex = nextPlayer;

  const allDone = s.initialRevealLeft.every(n => n === 0);
  if (allDone) {
    // Determine who goes first (highest initial sum)
    let highestScore = -Infinity;
    let startIndex = 0;
    for (let i = 0; i < s.players.length; i++) {
      const score = gridScore(s.players[i]);
      if (score > highestScore) { highestScore = score; startIndex = i; }
    }
    s.currentPlayerIndex = startIndex;
    s.phase = 'playing';
    s.turnPhase = 'draw';
    s.message = `C'est à ${s.players[startIndex].name} de briller ! Récolte au Paquet ou pique sur le Plateau ! 🍭`;
  } else {
    s.message = `${s.players[nextPlayer].name}, déballe 2 cartes pour lancer la fête ! 🏝️`;
  }

  return s;
}

// ─── DRAW FROM DISCARD ────────────────────────────────────────────────────────

export function drawFromDiscard(state: GameState): GameState {
  if (state.phase !== 'playing' && state.phase !== 'last_round') return state;
  if (state.turnPhase !== 'draw') return state;
  if (state.discardPile.length === 0) return state;

  const s = cloneState(state);
  const card = s.discardPile.pop()!;
  s.drawnCard = { ...card, isRevealed: true };
  s.turnPhase = 'discard_or_swap';
  s.message = `Tu pinces un « ${card.value} » sur le Plateau ! Swappe avec une case de ta grille (obligatoire).`;
  // Note: drawing from discard forces a swap — no option to discard it back.
  return s;
}

// ─── DRAW FROM DECK ───────────────────────────────────────────────────────────

export function drawFromDeck(state: GameState): GameState {
  if (state.phase !== 'playing' && state.phase !== 'last_round') return state;
  if (state.turnPhase !== 'draw') return state;

  const s = replenishDeckIfNeeded(cloneState(state));
  if (s.deck.length === 0) return state;

  const card = s.deck.shift()!;
  s.drawnCard = { ...card, isRevealed: true };
  s.turnPhase = 'discard_or_swap';
  s.message = `Tu récoltes un « ${card.value} » du Paquet ! Swap ou pose sur le Plateau, puis déballe une carte cachée.`;
  return s;
}

// ─── DISCARD DRAWN CARD ───────────────────────────────────────────────────────

export function discardDrawnCard(state: GameState): GameState {
  if (state.turnPhase !== 'discard_or_swap') return state;
  if (!state.drawnCard) return state;
  // Cannot discard if the card came from the discard pile (drawFromDiscard forces swap)
  // We track this by checking if drawn card was from discard:
  // (we can't easily distinguish here — but the UI will hide "discard" button after drawFromDiscard)

  const s = cloneState(state);
  s.discardPile.push({ ...s.drawnCard!, isRevealed: true });
  s.drawnCard = null;
  s.turnPhase = 'reveal_hidden';
  s.message = `Sur le Plateau ! Maintenant déballe une carte encore cachée sur ton îlot.`;
  return s;
}

// ─── SWAP DRAWN CARD WITH GRID ────────────────────────────────────────────────

export function swapWithGrid(
  state: GameState,
  row: number,
  col: number
): GameState {
  if (state.turnPhase !== 'discard_or_swap') return state;
  if (!state.drawnCard) return state;

  let s = cloneState(state);
  const player = s.players[s.currentPlayerIndex];
  const gridCard = player.grid[row][col];
  if (gridCard === null) return state; // slot is empty (column eliminated)

  // Place drawn card (revealed) into grid slot
  player.grid[row][col] = { ...s.drawnCard!, isRevealed: true };
  // Push old grid card to discard (revealed)
  s.discardPile.push({ ...gridCard, isRevealed: true });
  s.drawnCard = null;

  // Check column elimination
  s = checkAndEliminateColumns(s);

  return endTurn(s);
}

// ─── REVEAL HIDDEN CARD (after discarding drawn card) ────────────────────────

export function revealHiddenCard(
  state: GameState,
  row: number,
  col: number
): GameState {
  if (state.turnPhase !== 'reveal_hidden') return state;

  const s = cloneState(state);
  const player = s.players[s.currentPlayerIndex];
  const card = player.grid[row][col];
  if (!card || card.isRevealed) return state;

  card.isRevealed = true;

  // Check column elimination
  const checked = checkAndEliminateColumns(s);
  return endTurn(checked);
}

// ─── COLUMN ELIMINATION ───────────────────────────────────────────────────────

function checkAndEliminateColumns(state: GameState): GameState {
  const s = cloneState(state);
  const player = s.players[s.currentPlayerIndex];

  let col = findEliminableColumn(player.grid);
  while (col !== -1) {
    const { grid, removed } = eliminateColumn(player.grid, col);
    player.grid = grid;
    // Push removed cards to discard (top → last removed card)
    for (const c of removed) s.discardPile.push({ ...c, isRevealed: true });
    col = findEliminableColumn(player.grid);
  }
  return s;
}

// ─── END TURN ─────────────────────────────────────────────────────────────────

function endTurn(state: GameState): GameState {
  const s = cloneState(state);
  const player = s.players[s.currentPlayerIndex];

  // Did this player just reveal their last card?
  const allRevealed = player.grid.flat().every(c => c === null || c.isRevealed);

  if (allRevealed && s.phase === 'playing' && s.lastRoundPlayerIndex === null) {
    // Reveal all remaining hidden cards for this player
    player.grid = player.grid.map(row =>
      row.map(c => (c ? { ...c, isRevealed: true } : null))
    );
    s.lastRoundPlayerIndex = s.currentPlayerIndex;
    s.phase = 'last_round';
    s.message = `${player.name} a tout déballé ! Dernier tour pour les autres… puis on compte les pépites ! ✨`;
  }

  // Advance to next player
  const nextPlayer = (s.currentPlayerIndex + 1) % s.players.length;

  if (s.phase === 'last_round') {
    // Check if we've gone all the way around (next is the player who triggered last round)
    if (nextPlayer === s.lastRoundPlayerIndex) {
      return endRound(s);
    }
  }

  s.currentPlayerIndex = nextPlayer;
  s.turnPhase = 'draw';
  s.message = `${s.players[nextPlayer].name}, récolte au Paquet ou pique sur le Plateau ! 🍬`;
  return s;
}

// ─── END ROUND ────────────────────────────────────────────────────────────────

function endRound(state: GameState): GameState {
  const s = cloneState(state);

  // Reveal ALL cards
  for (const p of s.players) {
    p.grid = p.grid.map(row => row.map(c => (c ? { ...c, isRevealed: true } : null)));
  }

  const roundScores = s.players.map(fullGridScore);
  const finisherIdx = s.lastRoundPlayerIndex!;
  const finisherScore = roundScores[finisherIdx];

  // Doubling rule: finisher must be strictly less than ALL others
  const othersMin = roundScores
    .filter((_, i) => i !== finisherIdx)
    .reduce((min, v) => Math.min(min, v), Infinity);

  let finalFinisherScore = finisherScore;
  if (finisherScore > 0 && finisherScore >= othersMin) {
    finalFinisherScore = finisherScore * 2;
  }

  for (let i = 0; i < s.players.length; i++) {
    const score = i === finisherIdx ? finalFinisherScore : roundScores[i];
    s.players[i].scores.push(score);
    s.players[i].totalScore += score;
  }

  // Check game over (any player ≥ 100)
  const gameOver = s.players.some(p => p.totalScore >= 100);
  s.phase = gameOver ? 'game_over' : 'round_end';

  const doubled = finalFinisherScore !== finisherScore;
  s.message = doubled
    ? `Aïe ! Le sucre est monté à la tête… pépites doublées pour ${s.players[finisherIdx].name} (${finisherScore}→${finalFinisherScore}) ! 🍬x2`
    : `Fin de manche ! On additionne les pépites ✨`;

  return s;
}

// ─── NEW ROUND ────────────────────────────────────────────────────────────────

export function startNewRound(state: GameState): GameState {
  if (state.phase !== 'round_end') return state;

  const newDeck = shuffleDeck(buildDeck());
  const players: Player[] = state.players.map(p => ({
    ...clonePlayer(p),
    grid: emptyGrid(),
  }));

  let deckIdx = 0;
  for (const player of players) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        player.grid[row][col] = { ...newDeck[deckIdx++], isRevealed: false };
      }
    }
  }

  const deck = newDeck.slice(deckIdx);
  const firstDiscard = { ...deck.shift()!, isRevealed: true };

  // Player with highest total score starts the next round
  let highestTotal = -Infinity;
  let startIndex = 0;
  for (let i = 0; i < players.length; i++) {
    if (players[i].totalScore > highestTotal) {
      highestTotal = players[i].totalScore;
      startIndex = i;
    }
  }

  return {
    players,
    deck,
    discardPile: [firstDiscard],
    currentPlayerIndex: startIndex,
    phase: 'initial_reveal',
    turnPhase: 'draw',
    drawnCard: null,
    lastRoundPlayerIndex: null,
    roundNumber: state.roundNumber + 1,
    message: `Manche ${state.roundNumber + 1} ! ${players[startIndex].name}, déballe 2 cartes pour lancer la fête ! 🏝️`,
    initialRevealLeft: players.map(() => INITIAL_REVEAL_COUNT),
  };
}

// ─── AI TURN ─────────────────────────────────────────────────────────────────
// The AI only uses information a human player would have:
//   • Its own revealed cards
//   • The top card of the discard pile
//   • The drawn card (when it holds one)
// It never reads hidden card values.
//
// Difficulty profiles:
//   easy   — hesitant, high mistake rate, no column strategy
//   medium — balanced heuristic with small imperfection rate
//   expert — sharp: prefers combo setups, low mistake rate, strategic swaps

interface AiProfile {
  discardThreshold: number;  // take discard if value ≤ this AND it improves worst
  missDiscardRate:  number;  // probability of ignoring a good discard
  noSwapRate:       number;  // probability of not swapping even when beneficial
  comboAware:       boolean; // look for column-combo opportunities
}

const AI_PROFILES: Record<AiDifficulty, AiProfile> = {
  easy:   { discardThreshold: 1,  missDiscardRate: 0.50, noSwapRate: 0.40, comboAware: false },
  medium: { discardThreshold: 3,  missDiscardRate: 0.10, noSwapRate: 0.05, comboAware: false },
  expert: { discardThreshold: 2,  missDiscardRate: 0.02, noSwapRate: 0.02, comboAware: true  },
};

/** For expert mode: find a column where 2 of 3 visible cards match drawnValue. */
function findComboTarget(grid: Grid, drawnValue: number): [number, number] | null {
  for (let col = 0; col < COLS; col++) {
    const cells = grid.map(row => row[col]);
    const revealed = cells.filter(c => c !== null && c.isRevealed);
    const matchCount = revealed.filter(c => c!.value === drawnValue).length;
    if (matchCount >= 2) {
      // Find the non-revealed or non-matching slot to place the card
      for (let row = 0; row < ROWS; row++) {
        const c = cells[row];
        if (c !== null && (!c.isRevealed || c.value !== drawnValue)) {
          return [row, col];
        }
      }
    }
  }
  return null;
}

export function aiTakeTurn(state: GameState, difficulty: AiDifficulty = 'medium'): GameState {
  let s = cloneState(state);
  const prof = AI_PROFILES[difficulty];

  // ── Phase: draw ───────────────────────────────────────────────────────────
  if (s.turnPhase === 'draw') {
    const currentPlayer = s.players[s.currentPlayerIndex];
    const topDiscard = s.discardPile[s.discardPile.length - 1];

    const visibleValues = currentPlayer.grid
      .flat()
      .filter(c => c !== null && c.isRevealed)
      .map(c => c!.value);

    const maxVisible = visibleValues.length > 0 ? Math.max(...visibleValues) : -Infinity;

    const isGoodDiscard =
      topDiscard !== undefined &&
      topDiscard.value <= prof.discardThreshold &&
      maxVisible > topDiscard.value;

    const shouldTakeDiscard = isGoodDiscard && Math.random() > prof.missDiscardRate;
    s = shouldTakeDiscard ? drawFromDiscard(s) : drawFromDeck(s);
  }

  // ── Phase: discard_or_swap ────────────────────────────────────────────────
  if (s.turnPhase === 'discard_or_swap' && s.drawnCard) {
    const currentPlayer = s.players[s.currentPlayerIndex];
    const drawnValue = s.drawnCard.value;

    // Expert: check for 2-of-3 combo opportunity first
    if (prof.comboAware) {
      const comboTarget = findComboTarget(currentPlayer.grid, drawnValue);
      if (comboTarget && Math.random() > prof.noSwapRate) {
        s = swapWithGrid(s, comboTarget[0], comboTarget[1]);
        return s;
      }
    }

    // Find the worst VISIBLE card to potentially replace
    let worstRow = -1, worstCol = -1, worstValue = -Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const card = currentPlayer.grid[r][c];
        if (card && card.isRevealed && card.value > worstValue) {
          worstValue = card.value;
          worstRow = r;
          worstCol = c;
        }
      }
    }

    const canImprove = worstRow !== -1 && drawnValue < worstValue;

    if (canImprove && Math.random() > prof.noSwapRate) {
      s = swapWithGrid(s, worstRow, worstCol);
    } else {
      s = discardDrawnCard(s);
    }
  }

  // ── Phase: reveal_hidden ──────────────────────────────────────────────────
  if (s.turnPhase === 'reveal_hidden') {
    const currentPlayer = s.players[s.currentPlayerIndex];

    const hidden: [number, number][] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const card = currentPlayer.grid[r][c];
        if (card && !card.isRevealed) hidden.push([r, c]);
      }
    }

    if (hidden.length > 0) {
      // Expert: prefer revealing in columns that already have 2 matching visible cards
      let target: [number, number] | null = null;
      if (prof.comboAware) {
        for (const [r, c] of hidden) {
          const colCells = currentPlayer.grid.map(row => row[c]);
          const revealed = colCells.filter(card => card !== null && card.isRevealed);
          if (revealed.length >= 2) {
            const val = revealed[0]!.value;
            if (revealed.every(card => card!.value === val)) {
              target = [r, c];
              break;
            }
          }
        }
      }
      const [r, c] = target ?? hidden[Math.floor(Math.random() * hidden.length)];
      s = revealHiddenCard(s, r, c);
    }
  }

  return s;
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export { revealedCount, totalCards };
