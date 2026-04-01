import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useRlAi } from '../hooks/useRlAi';
import type { AiDifficulty } from '../engine/types';
import { useCardSizes } from '@/shared/hooks/useCardSizes';
import { useSoundEffects } from '@/shared/hooks/useSoundEffects';
import GameTopBar from '@/shared/components/GameTopBar';
import PlayersBar from '@/shared/components/PlayersBar';
import PlayerBoard from '@/components/PlayerBoard';
import DeckDiscard from '@/components/DeckDiscard';
import ScoreModal from '@/components/ScoreModal';
import GameMenu from '@/components/GameMenu';
import EndGameAnimation from '@/components/EndGameAnimation';
import {
  playButtonClick,
  playDrawDeck,
  playDrawDiscard,
  playDiscard,
  playSwapCard,
  playGameStart,
} from '@/shared/utils/sounds';

interface VsAiGameProps {
  names: string[];
  difficulty: AiDifficulty;
  onBackToMenu: () => void;
  token?: string | null;
  authUserId?: string | null;
}

export default function VsAiGame({ names, difficulty, onBackToMenu, token, authUserId }: VsAiGameProps) {
  const {
    gameState, startGame, initialReveal,
    drawDiscard, drawDeck, discardCard,
    swapCard, revealCard, newRound, aiTurn, setState,
  } = useGame();

  // RL expert AI — sends obs to /api/ai/action, falls back to TS heuristic
  const { takeTurn } = useRlAi(1, setState);

  useSoundEffects(gameState);
  const sizes            = useCardSizes();
  const aiTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu]       = useState(false);
  const [showEndAnim, setShowEndAnim] = useState(false);
  const prevPhaseRef     = useRef<string | null>(null);
  const startedAtRef     = useRef<Date>(new Date());
  const progressionSent  = useRef(false);

  // Start game on mount
  useEffect(() => {
    playGameStart();
    startGame(names);
    startedAtRef.current    = new Date();
    progressionSent.current = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC key toggles menu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const phase = gameState?.phase;
      if (phase === 'round_end' || phase === 'game_over') return;
      setShowMenu(v => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState?.phase]);

  // Trigger end-game animation + submit progression on game_over
  useEffect(() => {
    if (!gameState) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = gameState.phase;
    if (gameState.phase === 'game_over' && prev !== 'game_over') {
      const t = setTimeout(() => setShowEndAnim(true), 0);

      // Submit progression if user is authenticated
      if (token && authUserId && !progressionSent.current) {
        progressionSent.current = true;
        const endedAt = new Date();
        const winner  = [...gameState.players].sort((a, b) => a.totalScore - b.totalScore)[0];
        fetch('/api/progression/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            points:     gameState.players.find((p) => p.isHuman)?.totalScore ?? 0,
            startedAt:  startedAtRef.current.toISOString(),
            endedAt:    endedAt.toISOString(),
            allPlayers: gameState.players.map((p) => ({
              userId:   p.isHuman ? authUserId : null,
              name:     p.name,
              points:   p.totalScore,
              isAi:     !p.isHuman,
              isWinner: p.name === winner?.name,
            })),
          }),
        }).catch(() => { /* silent — progression not critical */ });
      }

      return () => clearTimeout(t);
    }
  }, [gameState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI auto-play
  useEffect(() => {
    if (!gameState) return;
    const { phase, turnPhase, currentPlayerIndex, players } = gameState;
    const cur = players[currentPlayerIndex];
    if (cur.isHuman) return;
    const isPlaying = phase === 'playing' || phase === 'last_round';
    const isInitial = phase === 'initial_reveal';
    const needs = (isPlaying && (turnPhase === 'draw' || turnPhase === 'discard_or_swap' || turnPhase === 'reveal_hidden')) || isInitial;
    if (!needs) return;

    aiTimerRef.current = setTimeout(() => {
      if (isInitial) {
        const hidden: [number, number][] = [];
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 4; c++)
            if (cur.grid[r][c] && !cur.grid[r][c]!.isRevealed) hidden.push([r, c]);
        if (hidden.length) {
          const [row, col] = hidden[Math.floor(Math.random() * hidden.length)];
          initialReveal(currentPlayerIndex, row, col);
        }
      } else if (difficulty === 'expert') {
        // Expert: query the ONNX model via backend (falls back to TS heuristic)
        takeTurn(gameState);
      } else {
        aiTurn(difficulty);
      }
    }, 850);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [gameState, aiTurn, takeTurn, initialReveal, difficulty]);

  if (!gameState) return null;
  const gs          = gameState;
  const isHumanTurn = gs.players[gs.currentPlayerIndex].isHuman;
  const humanPlayer = gs.players.find(p => p.isHuman);
  const topDiscard  = gs.discardPile[gs.discardPile.length - 1] ?? null;
  const winner      = [...gs.players].sort((a, b) => a.totalScore - b.totalScore)[0];
  const isModalOpen = gs.phase === 'round_end' || gs.phase === 'game_over';

  const canDrawDiscard =
    isHumanTurn && gs.turnPhase === 'draw' &&
    (gs.phase === 'playing' || gs.phase === 'last_round') &&
    gs.discardPile.length > 0;
  const canDrawDeck =
    isHumanTurn && gs.turnPhase === 'draw' &&
    (gs.phase === 'playing' || gs.phase === 'last_round');
  const canDiscardDrawn =
    isHumanTurn && gs.turnPhase === 'discard_or_swap' && !!gs.drawnCard;

  function handleCardClick(row: number, col: number) {
    const { phase, turnPhase, currentPlayerIndex } = gs;
    if (phase === 'initial_reveal') { initialReveal(currentPlayerIndex, row, col); return; }
    if (turnPhase === 'discard_or_swap') { playSwapCard(); swapCard(row, col); return; }
    if (turnPhase === 'reveal_hidden') { revealCard(row, col); }
  }

  return (
    <>
      <EndGameAnimation
        isVisible={showEndAnim}
        isVictory={winner?.isHuman ?? false}
        winnerName={winner?.name ?? ''}
        onComplete={() => setShowEndAnim(false)}
      />

      <motion.div
        key="game"
        className="w-full flex-1 flex flex-col items-center px-2 sm:px-4 py-2 sm:py-2 relative z-10 min-h-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Modals & overlays — outside layout flow */}
        <ScoreModal
          isOpen={!showEndAnim && isModalOpen}
          players={gs.players}
          roundNumber={gs.roundNumber}
          isGameOver={gs.phase === 'game_over'}
          onNewRound={() => { playButtonClick(); newRound(); }}
          onNewGame={() => { playButtonClick(); onBackToMenu(); }}
          onQuit={() => { playButtonClick(); onBackToMenu(); }}
        />

        <GameMenu
          isOpen={showMenu}
          onResume={() => setShowMenu(false)}
          onQuit={() => { playButtonClick(); onBackToMenu(); }}
        />

        {/* Settings FAB — fixed bottom-right, never overlaps in-flow content */}
        {!isModalOpen && (
          <motion.button
            className="sm:hidden"
            onClick={() => setShowMenu(true)}
            style={{
              position: 'fixed',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              right: 16,
              zIndex: 60,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(10, 4, 30, 0.95)',
              border: '3px solid rgba(255,255,255,0.9)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
          >
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>⚙</span>
          </motion.button>
        )}

        {/* ── In-flow layout — 5 sections stacked, distributed to fill height ── */}
        <div className="flex-1 w-full flex flex-col items-center justify-between sm:justify-start sm:gap-3 min-h-0 pb-20 sm:pb-2">

          {/* 1. Numéro de la manche */}
          <GameTopBar gs={gs} />

          {/* 3. Noms des participants (joueur + IA) */}
          <PlayersBar
            players={gs.players}
            currentPlayerIndex={gs.currentPlayerIndex}
            gamePhase={gs.phase}
          />

          {/* 4. Cartes (paquet + défausse + carte en main) */}
          <DeckDiscard
            deckCount={gs.deck.length}
            topDiscard={topDiscard}
            drawnCard={gs.drawnCard}
            canDrawDiscard={canDrawDiscard}
            canDrawDeck={canDrawDeck}
            canDiscardDrawn={canDiscardDrawn}
            onDrawDiscard={() => { playDrawDiscard(); drawDiscard(); }}
            onDrawDeck={() => { playDrawDeck(); drawDeck(); }}
            onDiscardDrawn={() => { playDiscard(); discardCard(); }}
            cardSize={sizes.deck}
          />

          {/* 5. Deck du joueur */}
          {humanPlayer && (
            <PlayerBoard
              player={humanPlayer}
              isActive={isHumanTurn && !isModalOpen}
              isHuman={true}
              turnPhase={gs.turnPhase}
              gamePhase={gs.phase}
              onCardClick={handleCardClick}
              cardSize={sizes.me}
              showLabel={false}
            />
          )}

        </div>
      </motion.div>
    </>
  );
}
