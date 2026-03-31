import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameIcon, { type SpriteIconId } from './GameIcon';

interface HelpStep {
  icon: SpriteIconId;
  title: string;
  desc: string;
  gradient: string;
}

function getHelp(
  gamePhase: string,
  turnPhase: string,
  isHumanTurn: boolean,
  hasDrawnCard: boolean,
): HelpStep {
  if (gamePhase === 'initial_reveal') {
    return {
      icon: 'bookPink',
      title: 'Déballe 2 cartes !',
      desc: 'Touche 2 cases de ton îlot pour les déballer — ce sont tes premières douceurs ! 🍬',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
    };
  }

  if (gamePhase === 'round_end') {
    return {
      icon: 'fruit',
      title: 'Fin de manche',
      desc: 'Admire les pépites puis lance la manche suivante pour continuer la gourmandise ! ✨',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FF9800 100%)',
    };
  }

  if (gamePhase === 'game_over') {
    return {
      icon: 'hammer',
      title: 'La fête est finie !',
      desc: 'Moins de pépites = plus de brillance ! Touche « Nouvelle gourmandise » pour rejouer. 🍭',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #1B5E20 100%)',
    };
  }

  if (!isHumanTurn) {
    return {
      icon: 'key',
      title: 'Un autre chef joue',
      desc: 'Patience… le sucre mijote côté plateau. Ton tour arrive ! 🏝️',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #4A148C 100%)',
    };
  }

  if (turnPhase === 'draw') {
    return {
      icon: 'play',
      title: 'Récolte une carte !',
      desc: 'Touche le Paquet pour une surprise, ou pique la carte visible du Plateau si elle te fait de l’œil. 🍌',
      gradient: 'linear-gradient(135deg, #03A9F4 0%, #01579B 100%)',
    };
  }

  if (turnPhase === 'discard_or_swap') {
    if (hasDrawnCard) {
      return {
        icon: 'hammer',
        title: 'Swap ou pose !',
        desc: 'Touche une case de ton îlot pour swapper… ou « Sur le Plateau ! » pour déballer une carte cachée ensuite.',
        gradient: 'linear-gradient(135deg, #E91E63 0%, #880E4F 100%)',
      };
    }
  }

  if (turnPhase === 'reveal_hidden') {
    return {
      icon: 'fruit',
      title: 'Déballe une carte !',
      desc: 'Choisis encore une case face cachée sur ton îlot — c’est le moment de briller ! ✨',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #1B5E20 100%)',
    };
  }

  return {
    icon: 'play',
    title: 'Sugar Swap',
    desc: 'Objectif : le moins de pépites possible ! Déballe tout le premier pour déclencher la fin de manche.',
    gradient: 'linear-gradient(135deg, #E91E63 0%, #FF9800 100%)',
  };
}

interface HelpButtonProps {
  gamePhase: string;
  turnPhase: string;
  isHumanTurn: boolean;
  hasDrawnCard: boolean;
}

export default function HelpButton({ gamePhase, turnPhase, isHumanTurn, hasDrawnCard }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const help = getHelp(gamePhase, turnPhase, isHumanTurn, hasDrawnCard);

  return (
    <>
      <motion.button
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 82px)',
          right: 16,
          zIndex: 50,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700, #FF9800)',
          border: '3px solid rgba(255,255,255,0.9)',
          cursor: 'pointer',
          fontFamily: 'var(--font-game)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
        animate={{
          boxShadow: [
            '0 4px 20px rgba(0,0,0,0.35), 0 0 0 0px rgba(255,215,0,0.6)',
            '0 4px 20px rgba(0,0,0,0.35), 0 0 0 10px rgba(255,215,0,0)',
            '0 4px 20px rgba(0,0,0,0.35), 0 0 0 0px rgba(255,215,0,0)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
        onClick={() => setOpen(v => !v)}
        aria-label="Aide"
      >
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>?</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
                right: 12,
                zIndex: 49,
                width: 'min(calc(100vw - 24px), 310px)',
                background: help.gradient,
                borderRadius: 24,
                border: '3px solid rgba(255,255,255,0.65)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                padding: '20px 20px 16px',
                fontFamily: 'var(--font-game)',
              }}
              initial={{ opacity: 0, scale: 0.75, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 24 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  position: 'absolute', top: 10, right: 12,
                  background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Fermer"
              >
                <GameIcon name="close" size={18} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                <GameIcon name={help.icon} size={40} />
              </div>

              <div style={{
                fontSize: '1.1rem', fontWeight: 900, color: 'white',
                textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.45)',
                marginBottom: 8,
              }}>
                {help.title}
              </div>

              <div style={{
                fontSize: '0.88rem', color: 'rgba(255,255,255,0.96)',
                textAlign: 'center', lineHeight: 1.55,
                textShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}>
                {help.desc}
              </div>

              <div style={{
                marginTop: 12, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)',
                textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Appuie sur l&apos;aide pour fermer
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
