import { motion } from 'framer-motion';
import type { GameState } from '@/features/game';
import Logo from '@/components/Logo';
import GameMessage from '@/components/GameMessage';

export default function GameTopBar({ gs }: { gs: GameState }) {
  const roundLabel = (
    <motion.div
      style={{
        fontFamily: 'var(--font-game)',
        fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)',
        fontWeight: 900,
        color: '#FFD700',
        WebkitTextStroke: '1.5px rgba(255,255,255,0.85)',
        textShadow: [
          '0 1px 0 #b8860b',
          '0 2px 0 #a07810',
          '0 3px 0 #8a6510',
          '0 4px 0 rgba(0,0,0,0.4)',
          '0 6px 18px rgba(0,0,0,0.55)',
          '0 0 20px rgba(255,215,0,0.45)',
        ].join(', '),
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        Manche {gs.roundNumber}
      </span>
    </motion.div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col items-center gap-3 sm:gap-4">
      {/* Logo: desktop only */}
      <div className="hidden sm:flex w-full justify-center">
        <Logo size="xl" />
      </div>
      <div className="flex justify-center w-full sm:-mt-2">
        {roundLabel}
      </div>
      {/* GameMessage: desktop only — mobile uses a fixed overlay in the game view */}
      <div className="flex justify-center w-full">
        <GameMessage message={gs.message} />
      </div>
    </div>
  );
}
