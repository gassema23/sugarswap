import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EndGameAnimationProps {
  isVisible: boolean;
  isVictory: boolean;
  winnerName: string;
  onComplete: () => void;
}

// Candy/tropical floating particles
const EMOJIS = ['🍭', '🍬', '🍌', '✨', '🏝️', '🍓', '🎉', '⭐', '🌟', '🍑'];

interface Particle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: EMOJIS[i % EMOJIS.length],
    x: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 1.8 + Math.random() * 1.4,
    size: 24 + Math.random() * 28,
    rotate: (Math.random() - 0.5) * 720,
  }));
}

const PARTICLES = generateParticles(28);

export default function EndGameAnimation({
  isVisible,
  isVictory,
  winnerName,
  onComplete,
}: EndGameAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isVisible) { setShow(false); return; }
    setShow(true);
    const t = setTimeout(onComplete, 2800);
    return () => clearTimeout(t);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 55,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: isVictory
              ? 'radial-gradient(ellipse at center, rgba(40,0,80,0.97) 0%, rgba(10,4,30,0.99) 100%)'
              : 'radial-gradient(ellipse at center, rgba(10,20,50,0.97) 0%, rgba(4,8,20,0.99) 100%)',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Falling candy particles */}
          {PARTICLES.map(p => (
            <motion.div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: '-60px',
                fontSize: p.size,
                lineHeight: 1,
                willChange: 'transform',
              }}
              initial={{ y: -60, opacity: 0, rotate: 0 }}
              animate={{
                y: '120vh',
                opacity: [0, 1, 1, 0],
                rotate: p.rotate,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.1, 0.55, 1],
              }}
            >
              {p.emoji}
            </motion.div>
          ))}

          {/* Central message */}
          <motion.div
            style={{ textAlign: 'center', padding: '0 24px', zIndex: 1 }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
          >
            {/* Big emoji pop */}
            <motion.div
              style={{ fontSize: 80, lineHeight: 1, marginBottom: 16 }}
              animate={{
                scale: [1, 1.25, 0.95, 1.1, 1],
                rotate: [0, -8, 8, -4, 0],
              }}
              transition={{ duration: 0.9, delay: 0.35, ease: 'easeInOut' }}
            >
              {isVictory ? '🏆' : '🍬'}
            </motion.div>

            {/* Main headline */}
            <motion.div
              style={{
                fontFamily: 'var(--font-game)',
                fontSize: 'clamp(1.6rem, 7vw, 2.8rem)',
                fontWeight: 900,
                background: isVictory
                  ? 'linear-gradient(135deg, #FFE866 0%, #FFD700 45%, #FFAA00 100%)'
                  : 'linear-gradient(135deg, #E91E63 0%, #FF9800 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 16px rgba(255,200,0,0.55))',
                marginBottom: 8,
                lineHeight: 1.15,
              }}
            >
              {isVictory ? 'Délicieux !' : 'La fête est finie !'}
            </motion.div>

            {/* Sub-text */}
            <motion.div
              style={{
                fontFamily: 'var(--font-game)',
                fontSize: 'clamp(1rem, 3.5vw, 1.4rem)',
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                fontWeight: 700,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              {isVictory
                ? `${winnerName} a la meilleure recette ! ✨`
                : `${winnerName} remporte les pépites ! 🍭`}
            </motion.div>
          </motion.div>

          {/* Radial glow burst */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: isVictory
                ? 'radial-gradient(circle at center, rgba(255,215,0,0.18) 0%, transparent 65%)'
                : 'radial-gradient(circle at center, rgba(233,30,99,0.18) 0%, transparent 65%)',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0.6], scale: [0.5, 1.5, 2] }}
            transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
