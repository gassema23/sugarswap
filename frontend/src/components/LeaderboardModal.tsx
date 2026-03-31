import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  totalMatches: number;
  totalPoints: number;
  averageScore: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

export default function LeaderboardModal({ isOpen, onClose, currentUserId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data: LeaderboardEntry[]) => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isOpen]);

  const medalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return 'rgba(255,255,255,0.35)';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 81,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              style={{
                width: 'min(calc(100vw - 32px), 480px)',
                maxHeight: '80dvh',
                background: 'linear-gradient(165deg, rgba(28,8,68,0.98) 0%, rgba(10,4,30,0.99) 100%)',
                border: '2px solid rgba(255,205,0,0.65)',
                boxShadow: '0 0 55px rgba(160,60,255,0.12), 0 26px 70px rgba(0,0,0,0.72)',
                borderRadius: 20,
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'var(--font-game)',
                pointerEvents: 'auto',
                overflow: 'hidden',
              }}
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#FFD700', textShadow: '0 0 12px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏆 Classement mondial
                </h2>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                >
                  ×
                </button>
              </div>

              <p style={{ margin: '8px 20px 4px', color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', flexShrink: 0 }}>
                Min. 5 parties · classé par score moyen le plus bas
              </p>

              {/* List */}
              <div style={{ overflowY: 'auto', padding: '8px 16px 16px', flex: 1 }}>
                {loading && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 32, fontSize: '0.85rem' }}>
                    Chargement…
                  </p>
                )}
                {!loading && entries.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 32, fontSize: '0.85rem' }}>
                    Aucun joueur classé pour l&apos;instant. Joue 5 parties pour apparaître ici !
                  </p>
                )}
                {entries.map((e) => {
                  const isMe = e.id === currentUserId;
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(e.rank * 0.03, 0.4) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 12,
                        marginBottom: 4,
                        background: isMe
                          ? 'rgba(255,215,0,0.12)'
                          : e.rank <= 3
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(255,255,255,0.03)',
                        border: isMe
                          ? '1px solid rgba(255,215,0,0.45)'
                          : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {/* Rank */}
                      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 900, fontSize: e.rank <= 3 ? '1.1rem' : '0.85rem', color: medalColor(e.rank) }}>
                        {e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank - 1] : e.rank}
                      </span>

                      {/* Avatar */}
                      {e.avatar ? (
                        <img src={e.avatar} alt={e.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,215,0,0.3)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#E91E63,#7B1FA2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color: '#fff', flexShrink: 0, border: '1.5px solid rgba(255,215,0,0.3)' }}>
                          {e.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name + stats */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: isMe ? '#FFD700' : 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.name}{isMe ? ' (toi)' : ''}
                          </span>
                          <span style={{ background: 'linear-gradient(135deg,#FF6B35,#FFD700)', borderRadius: 6, padding: '1px 6px', fontSize: '0.62rem', fontWeight: 900, color: '#1a1a1a', flexShrink: 0 }}>
                            Niv.{e.level}
                          </span>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>
                          {e.totalMatches} parties
                        </span>
                      </div>

                      {/* Avg score */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#FFD700', fontWeight: 900, fontSize: '1rem' }}>{e.averageScore}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem' }}>moy.</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
