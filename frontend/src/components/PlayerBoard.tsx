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
  gamePhase: string;
  onCardClick?: (row: number, col: number) => void;
  cardSize?: number;
  showLabel?: boolean;
}

const ROWS = 3;
const COLS = 4;

// ─── Floating pill badge ───────────────────────────────────────────────────────
function PlayerBadge({
  name,
  score,
  isActive,
  isHuman,
}: {
  name: string;
  score: number;
  isActive: boolean;
  isHuman: boolean;
}) {
  return (
    <motion.div
      className="flex items-center gap-1"
      style={{
        // Human → bottom-right corner, AI → top-left corner
        position: 'absolute',
        ...(isHuman
          ? { bottom: -10, right: -6, zIndex: 20 }
          : { top: -10, left: -6, zIndex: 20 }),
        background: isActive
          ? 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)'
          : 'rgba(10, 4, 30, 0.82)',
        border: isActive
          ? '2px solid #FFD700'
          : '1.5px solid rgba(255,255,255,0.22)',
        borderRadius: 999,
        padding: '3px 8px 3px 5px',
        backdropFilter: 'blur(10px)',
        boxShadow: isActive
          ? '0 4px 16px rgba(233,30,99,0.45), 0 0 0 1px rgba(255,215,0,0.3)'
          : '0 3px 12px rgba(0,0,0,0.55)',
        fontFamily: 'var(--font-game)',
        fontSize: '0.68rem',
        fontWeight: 700,
        color: 'white',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        whiteSpace: 'nowrap',
        maxWidth: 140,
        overflow: 'hidden',
      }}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 1.4, repeat: isActive ? Infinity : 0 }}
    >
      {isActive ? (
        <motion.span
          style={{ display: 'inline-flex', flexShrink: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <GameIcon name="fruit" size={11} />
        </motion.span>
      ) : (
        <GameIcon name="fruit" size={11} style={{ opacity: 0.45, flexShrink: 0 }} />
      )}

      {/* Name — truncated */}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 64 }}>
        {name}
      </span>

      {/* Score chip */}
      <span
        style={{
          background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.12)',
          borderRadius: 999,
          padding: '1px 6px',
          fontSize: '0.7rem',
          fontWeight: 900,
          color: isActive ? '#FFD700' : 'rgba(255,255,255,0.8)',
          textShadow: isActive ? '0 0 6px rgba(255,215,0,0.7)' : 'none',
          flexShrink: 0,
        }}
      >
        {score}
      </span>
    </motion.div>
  );
}

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
  function isCardClickable(row: number, col: number): boolean {
    if (!isHuman || !isActive) return false;
    const card = player.grid[row][col];
    if (!card) return false;
    if (gamePhase === 'initial_reveal') return !card.isRevealed;
    if (gamePhase !== 'playing' && gamePhase !== 'last_round') return false;
    switch (turnPhase) {
      case 'discard_or_swap': return true;
      case 'reveal_hidden':   return !card.isRevealed;
      default:                return false;
    }
  }

  const score = gridScore(player);
  // −10% breathing room
  const effectiveSize = Math.round(cardSize * 0.9);

  return (
    // Extra padding so the floating badge doesn't clip outside
    <div style={{ padding: isHuman ? '0 0 14px 0' : '14px 0 0 0', position: 'relative' }}>
      {/* Grid container — relative so badge can float over its corner */}
      <div
        className={`p-2 sm:p-3 rounded-2xl relative ${isActive ? 'active-player-glow' : ''}`}
        style={{
          background: isActive
            ? 'rgba(255,255,255,0.22)'
            : 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(8px)',
          border: isActive
            ? '2px solid rgba(255,215,0,0.55)'
            : '2px solid rgba(255,255,255,0.18)',
          boxShadow: isActive
            ? '0 0 24px rgba(255,215,0,0.15)'
            : '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* Floating badge — inside grid wrapper so position: absolute is relative to it */}
        {showLabel && (
          <PlayerBadge
            name={player.name}
            score={score}
            isActive={isActive}
            isHuman={isHuman}
          />
        )}

        {/* 4 columns × 3 rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${effectiveSize}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${Math.round(effectiveSize * 1.35)}px)`,
            gap: '8px',
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
                        width: effectiveSize,
                        height: Math.round(effectiveSize * 1.35),
                        borderRadius: 10,
                        border: '2px dashed rgba(255,255,255,0.25)',
                      }}
                    />
                  ) : (
                    <motion.div key={card.id} layout>
                      <Card
                        card={card}
                        interactive={clickable}
                        onClick={clickable ? () => onCardClick?.(row, col) : undefined}
                        highlight={clickable && turnPhase === 'discard_or_swap'}
                        size={effectiveSize}
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
