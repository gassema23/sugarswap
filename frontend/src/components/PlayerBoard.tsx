import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../engine/types';
import { gridScore } from '../engine/gameEngine';
import Card from './Card';
import GameIcon from './GameIcon';

interface PlayerBoardProps {
  player: Player;
  isActive: boolean;
  isHuman: boolean;
  turnPhase: 'draw' | 'discard_or_swap' | 'reveal_hidden';
  /** Phase of the full game, for controlling interaction */
  gamePhase: string;
  onCardClick?: (row: number, col: number) => void;
  cardSize?: number;
  showLabel?: boolean;
}

// ─── Column Elimination Confetti ──────────────────────────────────────────────
// (triggered externally via key change — see Board.tsx)

const ROWS = 3;
const COLS = 4;

export default function PlayerBoard({
  player,
  isActive,
  isHuman,
  turnPhase,
  gamePhase,
  onCardClick,
  cardSize = 68,
  showLabel = true,
}: PlayerBoardProps) {
  // A card is clickable for a human player depending on phase
  function isCardClickable(row: number, col: number): boolean {
    if (!isHuman || !isActive) return false;
    const card = player.grid[row][col];
    if (!card) return false;

    if (gamePhase === 'initial_reveal') return !card.isRevealed;
    if (gamePhase !== 'playing' && gamePhase !== 'last_round') return false;

    switch (turnPhase) {
      case 'discard_or_swap': return true;  // any slot: swap drawn card
      case 'reveal_hidden':   return !card.isRevealed;
      default:                return false;
    }
  }

  const score = gridScore(player);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Player label */}
      {showLabel && <motion.div
        className="flex items-center gap-2 px-4 py-1 rounded-full text-white font-bold"
        style={{
          background: isActive
            ? 'linear-gradient(135deg, #E91E63, #FF5722)'
            : 'rgba(0,0,0,0.3)',
          border: isActive ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.2)',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          fontFamily: 'var(--font-game)',
          backdropFilter: 'blur(6px)',
        }}
        animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
      >
        {isActive && (
          <motion.span
            style={{ display: 'inline-flex' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <GameIcon name="fruit" size={16} />
          </motion.span>
        )}
        <span>{player.name}</span>
        <span
          className="text-sm px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          {score} pts
        </span>
      </motion.div>}

      {/* Grid */}
      <div
        className={`p-2 sm:p-3 rounded-2xl relative ${isActive ? 'active-player-glow' : ''}`}
        style={{
          background: isActive
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          border: isActive ? undefined : '2px solid rgba(255,255,255,0.2)',
          boxShadow: isActive
            ? undefined
            : '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* 4 columns × 3 rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${cardSize}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${Math.round(cardSize * 1.35)}px)`,
            gap: '6px',
          }}
        >
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => {
              const card = player.grid[row][col];
              const clickable = isCardClickable(row, col);
              return (
                <AnimatePresence key={`${row}-${col}`} mode="wait">
                  {card === null ? (
                    <motion.div
                      key="empty"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0, opacity: 0 }}
                      style={{
                        width: cardSize,
                        height: Math.round(cardSize * 1.35),
                        borderRadius: 12,
                        border: '2px dashed rgba(255,255,255,0.3)',
                      }}
                    />
                  ) : (
                    <motion.div
                      key={card.id}
                      layout
                    >
                      <Card
                        card={card}
                        interactive={clickable}
                        onClick={clickable ? () => onCardClick?.(row, col) : undefined}
                        highlight={clickable && turnPhase === 'discard_or_swap'}
                        size={cardSize}
                        dealDelay={(row * COLS + col) * 0.05}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
