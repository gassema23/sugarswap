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

export default function GameMessage({ message }: { message: string }) {
  const { gradient, icon, border } = resolveStyle(message);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-bold text-center"
        style={{
          background: gradient,
          backdropFilter: 'blur(10px)',
          border: `2px solid ${border}`,
          fontFamily: 'var(--font-game)',
          textShadow: '0 1px 4px rgba(0,0,0,0.55)',
          fontSize: 'clamp(0.78rem, 2vw, 0.95rem)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          maxWidth: 'min(90vw, 480px)',
          lineHeight: 1.35,
        }}
        initial={{ opacity: 0, y: -18, scale: 0.82 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <GameIcon name={icon} size={22} style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
