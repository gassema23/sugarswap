import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setMuted, isMuted } from '../utils/sounds';
import GameIcon from './GameIcon';

interface GameMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onQuit: () => void;
}

export default function GameMenu({ isOpen, onResume, onQuit }: GameMenuProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [soundOn, setSoundOn] = useState(!isMuted());

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  }

  function handleResume() {
    setShowOptions(false);
    onResume();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleResume}
          />

          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 71,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              style={{
                width: 'min(calc(100vw - 32px), 300px)',
                background: 'rgba(0,0,0,0.38)',
                backdropFilter: 'blur(14px)',
                border: '2px solid rgba(255,215,0,0.35)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                borderRadius: 16,
                padding: '24px 24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontFamily: 'var(--font-game)',
                pointerEvents: 'auto',
              }}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ margin: 0, textAlign: 'center', color: '#FFD700', fontSize: '1.3rem', textShadow: '0 0 12px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <GameIcon name="settings" size={26} />
                Menu
              </h2>

              <button
                className="btn-candy w-full"
                style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleResume}
              >
                <GameIcon name="play" size={22} />
                Reprendre
              </button>

              <button
                className="btn-candy w-full"
                style={{
                  background: showOptions
                    ? 'linear-gradient(135deg,#0288D1,#00BCD4)'
                    : 'linear-gradient(135deg,#546E7A,#37474F)',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => setShowOptions(v => !v)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GameIcon name="settings" size={22} />
                  Options
                </span>
                <motion.span
                  style={{ fontSize: '0.75rem', opacity: 0.8 }}
                  animate={{ rotate: showOptions ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >▼</motion.span>
              </button>

              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,215,0,0.2)',
                      borderRadius: 12,
                      padding: '10px 14px',
                    }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 700 }}>
                        Sons {soundOn ? '(activés)' : '(coupés)'}
                      </span>
                      <button
                        type="button"
                        onClick={toggleSound}
                        style={{
                          width: 52,
                          height: 28,
                          borderRadius: 999,
                          background: soundOn
                            ? 'linear-gradient(135deg,#4CAF50,#00BCD4)'
                            : 'rgba(255,255,255,0.18)',
                          border: '2px solid rgba(255,215,0,0.35)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          padding: 0,
                          minHeight: 28,
                        }}
                      >
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: 2,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                          }}
                          animate={{ left: soundOn ? 26 : 4 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                className="btn-candy w-full"
                style={{
                  background: 'linear-gradient(135deg,#37474F,#263238)',
                  border: '2px solid rgba(255,87,34,0.5)',
                  fontSize: '0.9rem',
                  color: 'rgba(255,180,150,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onClick={onQuit}
              >
                <GameIcon name="close" size={20} />
                Quitter la partie
              </button>

              <p style={{ margin: 0, textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '0.7rem' }}>
                Appuie sur Échap pour reprendre
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
