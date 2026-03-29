import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '../engine/types';
import { cardColor, cardTextColor } from '../engine/deck';
import { playFlip } from '../utils/sounds';

interface CardProps {
  card: CardType | null;
  interactive?: boolean;
  onClick?: () => void;
  highlight?: boolean;
  empty?: boolean;
  size?: number;
  dealDelay?: number;
}

// ─── Glossy overlay (candy shine) ────────────────────────────────────────────
export function GlossOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-xl"
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%)',
      }}
    />
  );
}

// ─── Card number (thick, gummy style) ────────────────────────────────────────
function CardNumber({ value }: { value: number }) {
  const color = cardTextColor(value as CardType['value']);
  const fontSize = Math.abs(value) >= 10 ? '1.5rem' : '2rem';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center select-none"
      style={{
        fontFamily: 'var(--font-game)',
        fontSize,
        fontWeight: 900,
        color,
        textShadow: `
          0 2px 0 rgba(0,0,0,0.35),
          -1px -1px 0 rgba(0,0,0,0.2),
           1px -1px 0 rgba(0,0,0,0.2),
          -1px  1px 0 rgba(0,0,0,0.2),
           1px  1px 0 rgba(0,0,0,0.2),
           0 0 12px rgba(255,255,255,0.4)
        `,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function Card({
  card,
  interactive = false,
  onClick,
  highlight = false,
  empty = false,
  size = 72,
  dealDelay = 0,
}: CardProps) {
  const prevRevealed = useRef<boolean | null>(null);

  // Play flip sound when isRevealed transitions false → true
  useEffect(() => {
    if (card === null) return;
    if (prevRevealed.current === false && card.isRevealed === true) {
      playFlip();
    }
    prevRevealed.current = card.isRevealed;
  }, [card?.isRevealed]);

  if (empty || card === null) {
    return (
      <div
        style={{ width: size, height: size * 1.35 }}
        className="rounded-xl border-2 border-dashed border-white/30"
      />
    );
  }

  const isRevealed = card.isRevealed;
  const bgColor = isRevealed ? cardColor(card.value) : undefined;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -80 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: dealDelay }}
      whileHover={interactive ? { scale: 1.08, y: -4, zIndex: 10 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
      onClick={interactive ? onClick : undefined}
      className={`relative flip-container ${interactive ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size * 1.35 }}
    >
      {/* Highlight ring */}
      <AnimatePresence>
        {highlight && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ boxShadow: '0 0 0 3px #FFD700, 0 0 16px 4px rgba(255,215,0,0.8)' }}
          />
        )}
      </AnimatePresence>

      {/* 3D flip inner */}
      <div className={`flip-inner ${isRevealed ? 'flipped' : ''}`} style={{ width: size, height: size * 1.35 }}>

        {/* BACK */}
        <div className="flip-front w-full h-full card-back relative overflow-hidden" />

        {/* FRONT */}
        <div
          className="flip-back w-full h-full card-face relative overflow-hidden"
          style={{ background: bgColor }}
        >
          <div
            className="absolute inset-0 rounded-xl"
            style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 60%)' }}
          />
          <CardNumber value={card.value} />
          <GlossOverlay />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mini card (for drawn card display) ──────────────────────────────────────
export function MiniCard({ card, onClick, label }: { card: CardType; onClick?: () => void; label?: string }) {
  const bgColor = card.isRevealed ? cardColor(card.value) : undefined;

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: 60, height: 82 }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
    >
      {label && (
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
        >
          {label}
        </div>
      )}
      {card.isRevealed ? (
        <div className="w-full h-full card-face relative overflow-hidden" style={{ background: bgColor }}>
          <div className="absolute inset-0 rounded-xl" style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 flex items-center justify-center select-none" style={{ fontFamily: 'var(--font-game)', fontSize: '1.4rem', fontWeight: 900, color: cardTextColor(card.value), textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            {card.value}
          </div>
          <GlossOverlay />
        </div>
      ) : (
        <div className="w-full h-full card-back relative overflow-hidden" />
      )}
    </motion.div>
  );
}
