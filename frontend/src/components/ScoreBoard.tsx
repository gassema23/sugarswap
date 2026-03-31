import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '@/features/game';
import GameIcon, { rankSprite } from './GameIcon';

interface ScoreBoardProps {
  players: Player[];
  roundNumber: number;
  isGameOver: boolean;
  onNewRound?: () => void;
  onNewGame?: () => void;
  compact?: boolean;
}

export default function ScoreBoard({
  players,
  roundNumber,
  isGameOver,
  onNewRound,
  onNewGame,
  compact = false,
}: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore);
  const winner = sorted[0];

  if (compact) {
    const tinyBtn: React.CSSProperties = {
      background: isGameOver
        ? 'linear-gradient(135deg,#4CAF50,#03A9F4)'
        : 'linear-gradient(135deg,#E91E63,#FF9800)',
      fontSize: '0.7rem',
      padding: '0.25rem 0.65rem',
    };
    return (
      <div className="flex flex-wrap gap-1.5 items-center justify-end">
        {sorted.map((p, rank) => {
          const medal = rankSprite(rank);
          return (
            <div
              key={p.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: rank === 0 ? 'rgba(255,215,0,0.18)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${rank === 0 ? 'rgba(255,215,0,0.55)' : 'rgba(255,255,255,0.15)'}`,
                fontFamily: 'var(--font-game)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', width: 16, justifyContent: 'center' }}>
                {medal ? <GameIcon name={medal} size={14} /> : <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>{rank + 1}</span>}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem' }}>{p.name}</span>
              <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '0.72rem' }}>{p.totalScore}</span>
            </div>
          );
        })}
        {isGameOver && (
          <button type="button" className="btn-candy" style={tinyBtn} onClick={onNewGame}>Rejouer</button>
        )}
        {onNewRound && !isGameOver && (
          <button type="button" className="btn-candy" style={tinyBtn} onClick={onNewRound}>→</button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl p-4 sm:p-5 w-full sm:min-w-[220px] sm:w-auto"
      style={{
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
        border: '2px solid rgba(255,215,0,0.4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        fontFamily: 'var(--font-game)',
      }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="text-center mb-3">
        <div className="text-yellow-300 text-lg font-bold flex items-center justify-center gap-2" style={{ textShadow: '0 0 8px rgba(255,215,0,0.6)' }}>
          <GameIcon name="hammer" size={22} />
          Scores
        </div>
        <div className="text-white/50 text-xs">Manche {roundNumber}</div>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((player, rank) => {
          const medal = rankSprite(rank);
          return (
            <motion.div
              key={player.id}
              className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl"
              style={{
                background: rank === 0 ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.07)',
                border: rank === 0 ? '1px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
              }}
              layout
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center" style={{ minWidth: 24 }}>
                  {medal ? <GameIcon name={medal} size={20} /> : <span className="text-sm font-bold text-white/50">{rank + 1}</span>}
                </span>
                <span className="text-white font-bold text-sm">{player.name}</span>
              </div>
              <div className="text-right">
                <div className="text-yellow-300 font-bold text-lg leading-none">{player.totalScore}</div>
                {player.scores.length > 0 && (
                  <div className="text-white/40 text-xs">
                    {player.scores.map((s, i) => (
                      <span key={i} className="mr-1">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {(isGameOver || onNewRound) && (
          <motion.div
            className="mt-4 flex flex-col gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isGameOver ? (
              <>
                <div className="text-center text-white font-bold text-sm mb-1 flex items-center justify-center gap-2 flex-wrap">
                  <GameIcon name="fruit" size={18} />
                  {winner.name} gagne !
                </div>
                <button
                  type="button"
                  className="btn-candy w-full"
                  style={{ background: 'linear-gradient(135deg, #4CAF50, #03A9F4)' }}
                  onClick={onNewGame}
                >
                  Nouvelle partie
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-candy w-full"
                style={{ background: 'linear-gradient(135deg, #E91E63, #FF9800)' }}
                onClick={onNewRound}
              >
                Manche suivante →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
