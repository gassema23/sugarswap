import { useEffect, useRef } from 'react';
import type { GameState } from '@/features/game';
import {
  playColumnEliminated,
  playScoreDoubled,
  playRoundEnd,
  playVictory,
  playDefeat,
  playTurnStart,
} from '@/shared/utils/sounds';

export function useSoundEffects(gameState: GameState | null) {
  const prevPhaseRef     = useRef<string | null>(null);
  const prevPlayerIdxRef = useRef<number | null>(null);
  const prevNullsRef     = useRef<number>(0);

  useEffect(() => {
    if (!gameState) return;
    const { phase, currentPlayerIndex, players, message } = gameState;

    // Column eliminated
    const nulls = players.reduce((s, p) => s + p.grid.flat().filter(c => c === null).length, 0);
    if (nulls > prevNullsRef.current) playColumnEliminated();
    prevNullsRef.current = nulls;

    // Phase change
    if (phase !== prevPhaseRef.current) {
      if (phase === 'round_end') {
        if (message.toLowerCase().includes('doublé')) {
          setTimeout(playScoreDoubled, 600);
        } else {
          playRoundEnd();
        }
      }
      if (phase === 'game_over') {
        const winner = [...players].sort((a, b) => a.totalScore - b.totalScore)[0];
        setTimeout(() => winner.isHuman ? playVictory() : playDefeat(), 400);
      }
      prevPhaseRef.current = phase;
    }

    // Your turn ping
    if (
      currentPlayerIndex !== prevPlayerIdxRef.current &&
      players[currentPlayerIndex].isHuman &&
      (phase === 'playing' || phase === 'last_round')
    ) {
      playTurnStart();
    }
    prevPlayerIdxRef.current = currentPlayerIndex;
  }, [gameState]);
}
