/**
 * ProgressionToast — floating overlay shown after a progression_update
 * from the server (end of online game for authenticated players).
 * Auto-dismisses after 6 seconds.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProgressionUpdate } from '@/features/online';

const BADGE_LABELS: Record<string, string> = {
  FIRST_WIN:        '🏅 1ère victoire',
  VETERAN:          '⚔️ Vétéran',
  GRAND_MASTER:     '👑 Grand Maître',
  SHARP_MIND:       '🧠 Esprit vif',
  PERFECTIONIST:    '💎 Perfectionniste',
  LEVEL_5:          '⭐ Niveau 5',
  LEVEL_10:         '🌟 Niveau 10',
  LEVEL_15:         '✨ Niveau 15',
  SOCIAL_BUTTERFLY: '🌐 Social',
};

interface Props {
  update:   ProgressionUpdate | null;
  onDismiss: () => void;
}

export default function ProgressionToast({ update, onDismiss }: Props) {
  useEffect(() => {
    if (!update) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [update, onDismiss]);

  return (
    <AnimatePresence>
      {update && (
        <motion.div
          key="progression-toast"
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{   opacity: 0, y: 60,  scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={onDismiss}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'min(calc(100vw - 32px), 320px)',
            cursor: 'pointer',
            borderRadius: 20,
            overflow: 'hidden',
            background: 'linear-gradient(145deg, rgba(10,4,30,0.97) 0%, rgba(28,8,68,0.97) 100%)',
            border: update.levelUp
              ? '2px solid #FFD700'
              : '2px solid rgba(255,255,255,0.2)',
            boxShadow: update.levelUp
              ? '0 0 40px rgba(255,215,0,0.35), 0 16px 50px rgba(0,0,0,0.6)'
              : '0 8px 40px rgba(0,0,0,0.5)',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontFamily: 'var(--font-game)',
          }}
        >
          {/* Level up banner */}
          {update.levelUp && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 16 }}
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
                borderRadius: 12,
                padding: '8px 12px',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: '1.4rem', display: 'block', lineHeight: 1 }}>🎉</span>
              <span style={{ color: '#1a1a1a', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.04em' }}>
                NIVEAU {update.newLevel} !
              </span>
            </motion.div>
          )}

          {/* XP gained */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'linear-gradient(135deg, #4CAF50, #03A9F4)',
              borderRadius: 999, padding: '3px 12px',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff',
            }}>
              +{update.gainedXp} XP
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              → Niveau {update.newLevel}
            </span>
          </div>

          {/* New badges */}
          {update.newBadges.length > 0 && (
            <div className="flex flex-col gap-1">
              {update.newBadges.map((b) => (
                <div
                  key={b}
                  style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.35)',
                    borderRadius: 10, padding: '4px 10px',
                    fontSize: '0.78rem', color: '#FFD700',
                  }}
                >
                  {BADGE_LABELS[b] ?? b}
                </div>
              ))}
            </div>
          )}

          {/* New skins */}
          {update.unlockedSkins.length > 0 && (
            <div style={{ color: '#CE93D8', fontSize: '0.75rem' }}>
              🎨 Nouveau skin débloqué !
            </div>
          )}

          {/* Tap to dismiss hint */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', textAlign: 'center', margin: 0 }}>
            Toucher pour fermer
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
