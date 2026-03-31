import { motion } from 'framer-motion';
import type { Player, GamePhase } from '@/features/game';
import GameIcon from '@/components/GameIcon';

interface PlayersBarProps {
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: GamePhase;
}

export default function PlayersBar({ players, currentPlayerIndex, gamePhase }: PlayersBarProps) {
  const isActive = (i: number) =>
    i === currentPlayerIndex && gamePhase !== 'round_end' && gamePhase !== 'game_over';

  return (
    <div className="flex flex-wrap gap-2 justify-center w-full max-w-3xl">
      {players.map((p, i) => {
        const active  = isActive(i);
        const visible = p.grid.flat()
          .filter(c => c?.isRevealed)
          .reduce((s, c) => s + (c?.value ?? 0), 0);

        return (
          <motion.div
            key={p.id}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={active ? { duration: 1.2, repeat: Infinity } : {}}
            style={{
              background: active ? 'linear-gradient(135deg, #E91E63, #FF5722)' : 'rgba(0,0,0,0.30)',
              border: active ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              textShadow: active ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {p.isHuman ? <GameIcon name="play" size={16} /> : <GameIcon name="bookPink" size={16} />}
            </span>
            <span style={{ color: active ? '#FFD700' : 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontFamily: 'var(--font-game)' }}>
              {p.name}
            </span>
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.35)', color: active ? '#FFD700' : 'rgba(255,255,255,0.5)' }}
            >
              {visible > 0 ? `+${visible}` : visible}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
