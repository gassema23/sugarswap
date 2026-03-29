// ─── Card ────────────────────────────────────────────────────────────────────
export type CardValue = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Card {
  id: string;
  value: CardValue;
  isRevealed: boolean;
}

// Grid is 3 rows × 4 columns. null means the slot is empty (column eliminated).
export type Grid = (Card | null)[][];

// ─── Players ─────────────────────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  grid: Grid;        // grid[row][col]  (3 rows, 4 cols)
  isHuman: boolean;
  scores: number[];  // score per completed round
  totalScore: number;
}

// ─── Game phases ──────────────────────────────────────────────────────────────
export type GamePhase =
  | 'setup'           // First-time setup (dealing)
  | 'dealing'         // Animation: cards flying to grids
  | 'initial_reveal'  // Each player must reveal 2 cards
  | 'playing'         // Main game loop
  | 'last_round'      // After someone reveals all 12 cards — others get one turn
  | 'round_end'       // Scoring & doubling
  | 'game_over';      // A player exceeded 100 pts

export type TurnPhase =
  | 'draw'            // Player must choose: discard pile or deck
  | 'discard_or_swap' // Player drew from deck: keep (swap) or toss (→ reveal_hidden)
  | 'reveal_hidden';  // Player tossed drawn card → must flip one hidden card

// ─── Game state ───────────────────────────────────────────────────────────────
export interface GameState {
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turnPhase: TurnPhase;
  /** Card drawn from the deck, held in hand (not yet placed). */
  drawnCard: Card | null;
  /** Index of the player who triggered the last round (revealed their 12th card). */
  lastRoundPlayerIndex: number | null;
  roundNumber: number;
  message: string;
  /** How many cards each player still needs to reveal during initial_reveal phase. */
  initialRevealLeft: number[];
}
