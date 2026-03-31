import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import type { AiDifficulty } from '../engine/types';
import Logo from '@/components/Logo';
import GameIcon from '@/components/GameIcon';
import { playButtonClick } from '@/utils/sounds';
import { AI_NAME, GUEST_NAME, PANEL_WIDTH, CARD_BACKGROUND, CARD_BORDER, CARD_BOX_SHADOW } from '@/constants';

const DIFFICULTY_CONFIG: Record<AiDifficulty, { label: string; emoji: string; desc: string; gradient: string }> = {
  easy:   { label: 'Facile',  emoji: '🍬', desc: "L'IA fait des erreurs",   gradient: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)' },
  medium: { label: 'Moyen',   emoji: '🍭', desc: 'IA équilibrée',            gradient: 'linear-gradient(135deg, #FF9800 0%, #E91E63 100%)' },
  expert: { label: 'Expert',  emoji: '🏆', desc: 'IA redoutable !',          gradient: 'linear-gradient(135deg, #7B1FA2 0%, #E91E63 100%)' },
};

interface VsAiSetupProps {
  onStart: (names: string[], difficulty: AiDifficulty) => void;
  onBack: () => void;
}

const AI_NAME = 'Sirup';

export default function VsAiSetup({ onStart, onBack }: VsAiSetupProps) {
  const { user: authUser } = useAuth();
  const [p1, setP1] = useState(authUser?.name ?? 'Gourmand');
  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium');

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-game)',
    background: 'rgba(255,255,255,0.22)',
    border: '2px solid rgba(255,215,0,0.5)',
    borderRadius: '999px',
    padding: '0.45rem 1rem',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    textAlign: 'center',
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <Logo size="lg" />
      <div
        className="flex flex-col gap-3 rounded-3xl items-center"
        style={{
          background: [
            'radial-gradient(ellipse at 20% 20%, rgba(180,50,255,0.08) 0%, transparent 60%)',
            'radial-gradient(ellipse at 80% 80%, rgba(255,100,50,0.06) 0%, transparent 60%)',
            'linear-gradient(165deg, rgba(28,8,68,0.97) 0%, rgba(10,4,30,0.99) 100%)',
          ].join(', '),
          backdropFilter: 'blur(24px)',
          border: '2px solid rgba(255,205,0,0.65)',
          boxShadow: [
            '0 0 0 1px rgba(160,90,0,0.38)',
            '0 0 55px rgba(160,60,255,0.12)',
            '0 26px 70px rgba(0,0,0,0.72)',
            'inset 0 1px 0 rgba(255,220,100,0.32)',
            'inset 0 -1px 0 rgba(0,0,0,0.45)',
          ].join(', '),
          width: 'min(calc(100vw - 32px), 450px)',
          padding: '24px 20px',
          fontFamily: 'var(--font-game)',
        }}
      >
        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem', textShadow: '0 0 10px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <GameIcon name="robot" size={26} />
          Solo vs {AI_NAME}
        </h2>

        {/* Difficulty selector */}
        <div className="flex flex-col gap-1.5 w-full">
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Niveau de difficulté</label>
          <div className="flex gap-2 w-full">
            {(Object.entries(DIFFICULTY_CONFIG) as [AiDifficulty, typeof DIFFICULTY_CONFIG[AiDifficulty]][]).map(([key, cfg]) => {
              const isSelected = difficulty === key;
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => { playButtonClick(); setDifficulty(key); }}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-game)',
                    background: isSelected ? cfg.gradient : 'rgba(255,255,255,0.07)',
                    border: isSelected ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    padding: '8px 4px',
                    cursor: 'pointer',
                    color: 'white',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.4)' : 'none',
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 500 }}>{cfg.desc}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Ton surnom gourmand</label>
          <input style={inputStyle} value={p1} onChange={e => setP1(e.target.value)} placeholder="Gourmand" />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center' }}>
          Tu joueras contre <span style={{ color: '#FFD700', fontWeight: 700 }}>{AI_NAME}</span>
        </div>
        <button
          className="btn-candy w-full mt-1"
          style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => { playButtonClick(); onStart([p1 || 'Gourmand', AI_NAME], difficulty); }}
        >
          <GameIcon name="play" size={24} />
          Jouer !
        </button>
        <motion.button
          onClick={() => { playButtonClick(); onBack(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontFamily: 'var(--font-game)', display: 'flex', alignItems: 'center', gap: 5 }}
          whileHover={{ color: 'rgba(255,255,255,0.75)' }}
        >
          ← Retour
        </motion.button>
      </div>
    </motion.div>
  );
}
