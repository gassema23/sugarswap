import type { Card, CardValue } from './types';

// ─── Deck composition (150 cards total) ──────────────────────────────────────
// -2 → 5 cards   -1 → 10 cards   0 → 15 cards   1-12 → 10 cards each
const DISTRIBUTION: [CardValue, number][] = [
  [-2, 5],
  [-1, 10],
  [0,  15],
  [1,  10], [2, 10], [3, 10], [4, 10],
  [5,  10], [6, 10], [7, 10], [8, 10],
  [9,  10], [10,10], [11,10], [12,10],
];

let _idCounter = 0;

function makeCard(value: CardValue): Card {
  return { id: `c-${_idCounter++}`, value, isRevealed: false };
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const [value, count] of DISTRIBUTION) {
    for (let i = 0; i < count; i++) deck.push(makeCard(value));
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ─── Card colours (visual only — consumed by components) ─────────────────────
export function cardColor(value: CardValue): string {
  if (value === -2) return '#1565C0'; // deep blue
  if (value === -1) return '#42A5F5'; // light blue
  if (value ===  0) return '#4CAF50'; // emerald green
  if (value <=   3) return '#FFEB3B'; // sun yellow
  if (value <=   6) return '#FF9800'; // orange
  if (value <=   9) return '#F44336'; // red
  return '#7B0000';                   // deep danger red (10-12)
}

export function cardTextColor(value: CardValue): string {
  if (value <= 0) return '#ffffff';
  if (value <= 3) return '#333333';
  return '#ffffff';
}
