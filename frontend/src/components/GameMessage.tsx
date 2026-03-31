import { motion, AnimatePresence } from 'framer-motion';
import GameIcon, { type SpriteIconId } from './GameIcon';

interface MessageStyle {
  gradient: string;
  icon: SpriteIconId;
  border: string;
}

function resolveStyle(message: string): MessageStyle {
  const m = message.toLowerCase();

  if (m.includes('déballe') || m.includes('révèle') || m.includes('retourne'))
    return { gradient: 'linear-gradient(135deg,#FF9800,#FF5722)', icon: 'bookPink', border: 'rgba(255,152,0,0.6)' };

  if (m.includes('paquet') || m.includes('plateau') || m.includes('briller'))
    return { gradient: 'linear-gradient(135deg,#03A9F4,#0277BD)', icon: 'play', border: 'rgba(3,169,244,0.6)' };

  if (m.includes('récolte'))
    return { gradient: 'linear-gradient(135deg,#8E24AA,#6A1B9A)', icon: 'bookPurple', border: 'rgba(142,36,170,0.6)' };

  if (m.includes('pinces') || m.includes('depuis la défausse'))
    return { gradient: 'linear-gradient(135deg,#FFD700,#FF9800)', icon: 'key', border: 'rgba(255,215,0,0.6)' };

  if (m.includes('swap') || m.includes('échange') || m.includes('défausse'))
    return { gradient: 'linear-gradient(135deg,#E91E63,#C2185B)', icon: 'hammer', border: 'rgba(233,30,99,0.6)' };

  if (m.includes('sur le plateau') || m.includes('carte cachée') || m.includes('îlot'))
    return { gradient: 'linear-gradient(135deg,#4CAF50,#2E7D32)', icon: 'fruit', border: 'rgba(76,175,80,0.6)' };

  if (m.includes('tout déballé') || m.includes('dernier tour'))
    return { gradient: 'linear-gradient(135deg,#FF5722,#BF360C)', icon: 'close', border: 'rgba(255,87,34,0.6)' };

  if (m.includes('doublé') || m.includes('sucre est monté'))
    return { gradient: 'linear-gradient(135deg,#9C27B0,#E91E63)', icon: 'hammer', border: 'rgba(156,39,176,0.6)' };

  if (m.includes('manche'))
    return { gradient: 'linear-gradient(135deg,#FFD700,#FF9800)', icon: 'fruit', border: 'rgba(255,215,0,0.6)' };

  return { gradient: 'linear-gradient(135deg,rgba(0,0,0,0.55),rgba(0,0,0,0.38))', icon: 'play', border: 'rgba(255,255,255,0.25)' };
}

interface GameMessageProps {
  message: string;
  /** Compact mode: smaller padding, truncated — used for mobile fixed overlay */
  compact?: boolean;
}

export default function GameMessage({ message, compact = false }: GameMessageProps) {
  const { gradient, icon, border } = resolveStyle(message);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        className={`flex items-center gap-1.5 rounded-2xl text-white font-bold ${compact ? 'px-3 py-1' : 'px-4 py-2'}`}
        style={{
          background: gradient,
          backdropFilter: 'blur(12px)',
          border: `1.5px solid ${border}`,
          fontFamily: 'var(--font-game)',
          textShadow: '0 1px 4px rgba(0,0,0,0.55)',
          fontSize: compact ? '0.72rem' : 'clamp(0.78rem, 2vw, 0.95rem)',
          boxShadow: compact
            ? '0 4px 16px rgba(0,0,0,0.45)'
            : '0 4px 20px rgba(0,0,0,0.3)',
          maxWidth: compact ? 'min(88vw, 340px)' : 'min(90vw, 480px)',
          lineHeight: 1.3,
          overflow: 'hidden',
          whiteSpace: compact ? 'nowrap' : undefined,
          textOverflow: compact ? 'ellipsis' : undefined,
        }}
        initial={{ opacity: 0, y: compact ? -8 : -18, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        <GameIcon name={icon} size={compact ? 16 : 22} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: compact ? 'ellipsis' : undefined, whiteSpace: compact ? 'nowrap' : undefined }}>
          {message}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
