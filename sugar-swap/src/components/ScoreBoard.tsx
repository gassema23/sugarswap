import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../engine/types';

interface ScoreBoardProps {
  players: Player[];
  roundNumber: number;
  isGameOver: boolean;
  onNewRound?: () => void;
  onNewGame?: () => void;
}

export default function ScoreBoard({
  players,
  roundNumber,
  isGameOver,
  onNewRound,
  onNewGame,
}: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore);
  const winner = sorted[0];

  return (
    <motion.div
      className="rounded-2xl p-5 min-w-[240px]"
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
      {/* Header */}
      <div className="text-center mb-3">
        <div className="text-yellow-300 text-lg font-bold" style={{ textShadow: '0 0 8px rgba(255,215,0,0.6)' }}>
          🏆 Scores
        </div>
        <div className="text-white/50 text-xs">Manche {roundNumber}</div>
      </div>

      {/* Player rows */}
      <div className="flex flex-col gap-2">
        {sorted.map((player, rank) => (
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
              <span className="text-base">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span>
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
        ))}
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {(isGameOver || onNewRound) && (
          <motion.div
            className="mt-4 flex flex-col gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isGameOver ? (
              <>
                <div className="text-center text-white font-bold text-sm mb-1">
                  🎉 {winner.name} gagne !
                </div>
                <button
                  className="btn-candy w-full"
                  style={{ background: 'linear-gradient(135deg, #4CAF50, #03A9F4)' }}
                  onClick={onNewGame}
                >
                  Nouvelle partie
                </button>
              </>
            ) : (
              <button
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
