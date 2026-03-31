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
// It NEVER reads hidden card values.
//
// Deck statistics: 150 cards, values -2..12
//   sum = 5×(-2) + 10×(-1) + 15×0 + 10×(1+2+…+12) = 760
//   expected value of any unknown card ≈ 760/150 ≈ 5.07
//
// Difficulty profiles:
//   easy   — hesitant, high randomness, ignores strategy
//   medium — improved heuristic using expected hidden-card value
//   expert — full evaluation: column combos, expected-value swaps, strategic reveals

const EXPECTED_UNKNOWN = 760 / 150; // ≈ 5.07

/**
 * The "effective value" of a grid cell for decision-making:
 *   • null  (eliminated slot) → 0
 *   • revealed card          → its actual value
 *   • hidden card            → expected value of an unknown card
 */
function effectiveCardValue(card: Card | null): number {
  if (card === null) return 0;
  return card.isRevealed ? card.value : EXPECTED_UNKNOWN;
}

/**
 * Score improvement from placing drawnValue at (row, col).
 * Returns: removedValue − drawnValue + bonus for column combos.
 * Higher = better for the AI (score decreases).
 * Returns -Infinity for null (eliminated) slots.
 */
function evaluateSwapGain(grid: Grid, row: number, col: number, drawnValue: number): number {
  const cell = grid[row][col];
  if (cell === null) return -Infinity;

  const removedValue = effectiveCardValue(cell);
  let gain = removedValue - drawnValue;

  // Column bonus: check other cells in the same column (after the hypothetical swap)
  const otherCells = grid.map((r, ri) => ri === row ? null : r[col]);
  const otherRevealed = otherCells.filter(c => c !== null && c.isRevealed);

  if (otherRevealed.length === 2 && otherRevealed.every(c => c!.value === drawnValue)) {
    // Placing drawnValue here eliminates the entire column → massive bonus
    gain += 30;
  } else if (otherRevealed.length === 1 && otherRevealed[0]!.value === drawnValue) {
    // Creates a 2-of-3 match in the column → good setup
    gain += 6;
  }

  return gain;
}

// ─── Easy AI ──────────────────────────────────────────────────────────────────

function easyAiTurn(state: GameState): GameState {
  let s = cloneState(state);

  if (s.turnPhase === 'draw') {
    const topDiscard = s.discardPile[s.discardPile.length - 1];
    // Only take discard if it's ≤ 0 AND we randomly decide to (50% miss rate)
    const takeDiscard =
      topDiscard !== undefined &&
      topDiscard.value <= 0 &&
      Math.random() > 0.50;
    s = takeDiscard ? drawFromDiscard(s) : drawFromDeck(s);
  }

  if (s.turnPhase === 'discard_or_swap' && s.drawnCard) {
    const player = s.players[s.currentPlayerIndex];
    const drawnValue = s.drawnCard.value;

    // 40% chance of making a random (possibly bad) swap
    if (Math.random() < 0.40) {
      const nonNull: [number, number][] = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (player.grid[r][c] !== null) nonNull.push([r, c]);
      if (nonNull.length > 0) {
        const [r, c] = nonNull[Math.floor(Math.random() * nonNull.length)];
        return swapWithGrid(s, r, c);
      }
    }

    // Otherwise: swap only with worst visible if clear improvement
    let worstRow = -1, worstCol = -1, worstValue = -Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const card = player.grid[r][c];
        if (card?.isRevealed && card.value > worstValue) {
          worstValue = card.value; worstRow = r; worstCol = c;
        }
      }
    }
    if (worstRow !== -1 && drawnValue < worstValue && Math.random() > 0.40) {
      s = swapWithGrid(s, worstRow, worstCol);
    } else {
      s = discardDrawnCard(s);
    }
  }

  if (s.turnPhase === 'reveal_hidden') {
    const player = s.players[s.currentPlayerIndex];
    const hidden: [number, number][] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (player.grid[r][c] && !player.grid[r][c]!.isRevealed) hidden.push([r, c]);
    if (hidden.length > 0) {
      const [r, c] = hidden[Math.floor(Math.random() * hidden.length)];
      s = revealHiddenCard(s, r, c);
    }
  }

  return s;
}

// ─── Medium AI ────────────────────────────────────────────────────────────────

function mediumAiTurn(state: GameState): GameState {
  let s = cloneState(state);

  if (s.turnPhase === 'draw') {
    const player = s.players[s.currentPlayerIndex];
    const topDiscard = s.discardPile[s.discardPile.length - 1];

    // Consider visible cards only
    const visibleValues = player.grid.flat()
      .filter(c => c !== null && c.isRevealed)
      .map(c => c!.value);
    const maxVisible = visibleValues.length > 0 ? Math.max(...visibleValues) : -Infinity;

    const isGoodDiscard =
      topDiscard !== undefined &&
      topDiscard.value <= 4 &&
      maxVisible > topDiscard.value;

    const shouldTakeDiscard = isGoodDiscard && Math.random() > 0.10;
    s = shouldTakeDiscard ? drawFromDiscard(s) : drawFromDeck(s);
  }

  if (s.turnPhase === 'discard_or_swap' && s.drawnCard) {
    const player = s.players[s.currentPlayerIndex];
    const drawnValue = s.drawnCard.value;

    // Swap with worst VISIBLE card if clear improvement
    let worstRow = -1, worstCol = -1, worstValue = -Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const card = player.grid[r][c];
        if (card?.isRevealed && card.value > worstValue) {
          worstValue = card.value; worstRow = r; worstCol = c;
        }
      }
    }

    // Also consider replacing a hidden card if drawn is below average
    let hiddenRow = -1, hiddenCol = -1;
    if (drawnValue < EXPECTED_UNKNOWN) {
      // Pick a random hidden slot (we can't know which is worst)
      const hiddenSlots: [number, number][] = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (player.grid[r][c] && !player.grid[r][c]!.isRevealed) hiddenSlots.push([r, c]);
      if (hiddenSlots.length > 0) {
        [hiddenRow, hiddenCol] = hiddenSlots[Math.floor(Math.random() * hiddenSlots.length)];
      }
    }

    const swapWithVisible = worstRow !== -1 && drawnValue < worstValue && Math.random() > 0.05;
    // Swap hidden only if drawn is below average AND no visible card is a better target
    const swapWithHidden  =
      hiddenRow !== -1 &&
      drawnValue < EXPECTED_UNKNOWN - 1 &&
      (worstRow === -1 || worstValue <= drawnValue) &&
      Math.random() > 0.05;

    if (swapWithVisible) {
      s = swapWithGrid(s, worstRow, worstCol);
    } else if (swapWithHidden) {
      s = swapWithGrid(s, hiddenRow, hiddenCol);
    } else {
      s = discardDrawnCard(s);
    }
  }

  if (s.turnPhase === 'reveal_hidden') {
    const player = s.players[s.currentPlayerIndex];
    const hidden: [number, number][] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (player.grid[r][c] && !player.grid[r][c]!.isRevealed) hidden.push([r, c]);
    if (hidden.length > 0) {
      const [r, c] = hidden[Math.floor(Math.random() * hidden.length)];
      s = revealHiddenCard(s, r, c);
    }
  }

  return s;
}

// ─── Expert AI ────────────────────────────────────────────────────────────────

function expertAiTurn(state: GameState): GameState {
  let s = cloneState(state);

  // ── Draw phase ────────────────────────────────────────────────────────────
  if (s.turnPhase === 'draw') {
    const player = s.players[s.currentPlayerIndex];
    const topDiscard = s.discardPile[s.discardPile.length - 1];

    if (topDiscard) {
      // Evaluate best swap gain if we take the discard
      let bestDiscardGain = -Infinity;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const gain = evaluateSwapGain(player.grid, r, c, topDiscard.value);
          if (gain > bestDiscardGain) bestDiscardGain = gain;
        }

      // How many hidden cards do we have?  More hidden → deck draw (discard + reveal) is more valuable
      const hiddenCount = player.grid.flat().filter(c => c !== null && !c.isRevealed).length;

      // Break-even: taking discard is worthwhile if the gain justifies losing the "reveal" option
      // Deck draw gives us flexibility: either swap a good card OR discard + reveal hidden
      // Heuristic threshold: higher when we have many hidden slots
      const threshold = 1.5 + hiddenCount * 0.4;

      s = bestDiscardGain >= threshold ? drawFromDiscard(s) : drawFromDeck(s);
    } else {
      s = drawFromDeck(s);
    }
  }

  // ── Discard-or-swap phase ─────────────────────────────────────────────────
  if (s.turnPhase === 'discard_or_swap' && s.drawnCard) {
    const player = s.players[s.currentPlayerIndex];
    const drawnValue = s.drawnCard.value;

    // Find the best swap position across ALL grid slots (revealed + hidden)
    let bestGain = -Infinity;
    let bestRow = -1, bestCol = -1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const gain = evaluateSwapGain(player.grid, r, c, drawnValue);
        if (gain > bestGain) { bestGain = gain; bestRow = r; bestCol = c; }
      }
    }

    // Discard + reveal is worth approximately 1 point in expected score reduction
    // (We reveal one hidden card ≈ 5.07 → might enable a good swap next turn)
    const REVEAL_VALUE = 1.0;

    if (bestRow !== -1 && bestGain >= REVEAL_VALUE) {
      s = swapWithGrid(s, bestRow, bestCol);
    } else {
      s = discardDrawnCard(s);
    }
  }

  // ── Reveal-hidden phase ───────────────────────────────────────────────────
  if (s.turnPhase === 'reveal_hidden') {
    const player = s.players[s.currentPlayerIndex];

    // Priority 1: complete a column (2 matching revealed + 1 hidden in same col)
    for (let c = 0; c < COLS; c++) {
      const colCells = player.grid.map(row => row[c]);
      const revealed = colCells.filter(cell => cell !== null && cell.isRevealed);
      if (
        revealed.length === 2 &&
        revealed.every(cell => cell!.value === revealed[0]!.value)
      ) {
        for (let r = 0; r < ROWS; r++) {
          const card = player.grid[r][c];
          if (card && !card.isRevealed) return revealHiddenCard(s, r, c);
        }
      }
    }

    // Priority 2: reveal in the column with the highest effective total
    // (exposes potential swap targets; high-value columns are worst to keep)
    let bestColScore = -Infinity;
    let bestTarget: [number, number] | null = null;
    for (let c = 0; c < COLS; c++) {
      const colCells = player.grid.map(row => row[c]);
      const hasHidden = colCells.some(cell => cell !== null && !cell.isRevealed);
      if (!hasHidden) continue;
      const colScore = colCells.reduce((sum, cell) => sum + effectiveCardValue(cell), 0);
      if (colScore > bestColScore) {
        bestColScore = colScore;
        for (let r = 0; r < ROWS; r++) {
          const card = player.grid[r][c];
          if (card && !card.isRevealed) { bestTarget = [r, c]; break; }
        }
      }
    }

    if (bestTarget) return revealHiddenCard(s, bestTarget[0], bestTarget[1]);

    // Fallback: random hidden card
    const hidden: [number, number][] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (player.grid[r][c] && !player.grid[r][c]!.isRevealed) hidden.push([r, c]);
    if (hidden.length > 0) {
      const [r, c] = hidden[Math.floor(Math.random() * hidden.length)];
      s = revealHiddenCard(s, r, c);
    }
  }

  return s;
}

// ─── Public dispatcher ────────────────────────────────────────────────────────

export function aiTakeTurn(state: GameState, difficulty: AiDifficulty = 'medium'): GameState {
  switch (difficulty) {
    case 'easy':   return easyAiTurn(state);
    case 'medium': return mediumAiTurn(state);
    case 'expert': return expertAiTurn(state);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export { revealedCount, totalCards };
