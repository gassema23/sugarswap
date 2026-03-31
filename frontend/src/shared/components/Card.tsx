/**
 * Card — visual container card (UI layout element, NOT the game card).
 * For the game playing card, see features/game/components/Card.tsx
 */
import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  glow?: 'gold' | 'pink' | 'blue' | 'none';
  animate?: boolean;
}

const GLOW: Record<string, string> = {
  gold: '0 0 32px rgba(255,215,0,0.18), 0 8px 32px rgba(0,0,0,0.45)',
  pink: '0 0 32px rgba(233,30,99,0.18), 0 8px 32px rgba(0,0,0,0.45)',
  blue: '0 0 32px rgba(3,169,244,0.18), 0 8px 32px rgba(0,0,0,0.45)',
  none: '0 8px 32px rgba(0,0,0,0.35)',
};

export default function Card({
  children,
  className = '',
  style,
  onClick,
  glow = 'none',
  animate = false,
}: CardProps) {
  const base: CSSProperties = {
    background: 'linear-gradient(160deg, rgba(28,8,68,0.96) 0%, rgba(10,4,30,0.98) 100%)',
    border: '2px solid rgba(255,215,0,0.3)',
    borderRadius: 20,
    padding: '20px 18px',
    fontFamily: 'var(--font-game)',
    backdropFilter: 'blur(14px)',
    boxShadow: GLOW[glow],
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };

  if (animate) {
    return (
      <motion.div
        style={base}
        className={className}
        onClick={onClick}
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div style={base} className={className} onClick={onClick}>
      {children}
    </div>
  );
}
