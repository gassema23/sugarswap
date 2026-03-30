import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../engine/types';
import GameIcon, { rankSprite } from './GameIcon';

interface ScoreModalProps {
  isOpen: boolean;
  players: Player[];
  roundNumber: number;
  isGameOver: boolean;
  onNewRound?: () => void;
  onNewGame?: () => void;
  onQuit: () => void;
}

export default function ScoreModal({
  isOpen,
  players,
  roundNumber,
  isGameOver,
  onNewRound,
  onNewGame,
  onQuit,
}: ScoreModalProps) {
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore);
  const winner = sorted[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 61,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              style={{
                width: 'min(100%, 380px)',
                background: isGameOver
                  ? 'linear-gradient(160deg, #1a0533 0%, #2d0a5c 50%, #1a1a2e 100%)'
                  : 'linear-gradient(160deg, #0d2137 0%, #1a3a5c 50%, #0d1b2a 100%)',
                borderRadius: 28,
                border: `3px solid ${isGameOver ? 'rgba(255,215,0,0.8)' : 'rgba(3,169,244,0.6)'}`,
                boxShadow: isGameOver
                  ? '0 0 60px rgba(255,215,0,0.25), 0 20px 60px rgba(0,0,0,0.6)'
                  : '0 0 40px rgba(3,169,244,0.2), 0 20px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                fontFamily: 'var(--font-game)',
              }}
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >

              <div
                style={{
                  padding: '24px 24px 16px',
                  textAlign: 'center',
                  background: isGameOver
                    ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,152,0,0.1))'
                    : 'linear-gradient(135deg, rgba(3,169,244,0.15), rgba(0,188,212,0.1))',
                  borderBottom: `1px solid ${isGameOver ? 'rgba(255,215,0,0.2)' : 'rgba(3,169,244,0.2)'}`,
                }}
              >
                {isGameOver ? (
                  <>
                    <motion.div
                      style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}
                      animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      <GameIcon name="hammer" size={48} />
                    </motion.div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFD700', textShadow: '0 2px 12px rgba(255,215,0,0.6)' }}>
                      Partie terminée !
                    </div>
                    <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <GameIcon name="fruit" size={22} />
                      <span>{winner.name} remporte la partie !</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                      <GameIcon name="fruit" size={40} />
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#03A9F4', textShadow: '0 2px 8px rgba(3,169,244,0.5)' }}>
                      Fin de manche {roundNumber}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                      Scores cumulés
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((player, rank) => {
                  const isTopPlayer = rank === 0;
                  const lastRoundScore = player.scores[player.scores.length - 1];
                  const medal = rankSprite(rank);
                  return (
                    <motion.div
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 16,
                        background: isTopPlayer
                          ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,152,0,0.1))'
                          : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${isTopPlayer ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + rank * 0.08 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28 }}>
                          {medal
                            ? <GameIcon name={medal} size={26} />
                            : <span style={{ fontSize: '1rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{rank + 1}</span>}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                            {player.name}
                          </div>
                          {player.scores.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                              {player.scores.map((s, i) => (
                                <span key={i} style={{ marginRight: 4 }}>M{i + 1}: {s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isTopPlayer ? '#FFD700' : 'white', lineHeight: 1, textShadow: isTopPlayer ? '0 0 12px rgba(255,215,0,0.6)' : 'none' }}>
                          {player.totalScore}
                        </div>
                        {lastRoundScore !== undefined && (
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                            +{lastRoundScore} cette manche
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isGameOver ? (
                  <motion.button
                    className="btn-candy w-full"
                    style={{ background: 'linear-gradient(135deg, #4CAF50, #00BCD4)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={onNewGame}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <GameIcon name="play" size={22} />
                    Nouvelle partie
                  </motion.button>
                ) : (
                  <motion.button
                    className="btn-candy w-full"
                    style={{ background: 'linear-gradient(135deg, #E91E63, #FF9800)', fontSize: '1rem' }}
                    onClick={onNewRound}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Manche suivante →
                  </motion.button>
                )}

                <motion.button
                  type="button"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: 999,
                    padding: '0.5rem 1rem',
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'var(--font-game)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onClick={onQuit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <GameIcon name="close" size={18} />
                  Quitter la partie
                </motion.button>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
