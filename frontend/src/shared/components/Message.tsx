import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

export type MessageVariant = 'info' | 'success' | 'warning' | 'error' | 'sugar';

const VARIANT_COLORS: Record<MessageVariant, { bg: string; border: string; color: string }> = {
  info:    { bg: 'rgba(3,169,244,0.12)',   border: 'rgba(3,169,244,0.35)',   color: '#03A9F4' },
  success: { bg: 'rgba(76,175,80,0.12)',   border: 'rgba(76,175,80,0.35)',   color: '#4CAF50' },
  warning: { bg: 'rgba(255,235,59,0.12)',  border: 'rgba(255,235,59,0.35)',  color: '#FFEB3B' },
  error:   { bg: 'rgba(244,67,54,0.12)',   border: 'rgba(244,67,54,0.35)',   color: '#F44336' },
  sugar:   { bg: 'rgba(233,30,99,0.12)',   border: 'rgba(255,215,0,0.4)',    color: '#FFD700' },
};

interface MessageProps {
  children: ReactNode;
  variant?: MessageVariant;
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
}

export default function Message({
  children,
  variant = 'sugar',
  className = '',
  style,
  animate = true,
}: MessageProps) {
  const colors = VARIANT_COLORS[variant];

  const content = (
    <div
      className={className}
      style={{
        fontFamily: 'var(--font-game)',
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 999,
        padding: '0.45rem 1.1rem',
        color: colors.color,
        fontSize: '0.85rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        textAlign: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      {content}
    </motion.div>
  );
}
