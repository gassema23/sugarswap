import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import type { AiDifficulty } from '../engine/types';
import { useCardSizes } from '@/shared/hooks/useCardSizes';
import { useSoundEffects } from '@/shared/hooks/useSoundEffects';
import GameTopBar from '@/shared/components/GameTopBar';
import PlayersBar from '@/shared/components/PlayersBar';
import PlayerBoard from '@/components/PlayerBoard';
import DeckDiscard from '@/components/DeckDiscard';
import ScoreModal from '@/components/ScoreModal';
import GameMessage from '@/components/GameMessage';
import GameMenu from '@/components/GameMenu';
import EndGameAnimation from '@/components/EndGameAnimation';
import {
  playButtonClick,
  playDrawDeck,
  playDrawDiscard,
  playDiscard,
  playSwapCard,
  playGameStart,
} from '@/utils/sounds';

interface VsAiGameProps {
  names: string[];
  difficulty: AiDifficulty;
  onBackToMenu: () => void;
}

export default function VsAiGame({ names, difficulty, onBackToMenu }: VsAiGameProps) {
  const {
    gameState, startGame, initialReveal,
    drawDiscard, drawDeck, discardCard,
    swapCard, revealCard, newRound, aiTurn,
  } = useGame();

  useSoundEffects(gameState);
  const sizes        = useCardSizes();
  const aiTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMenu, setShowMenu]       = useState(false);
  const [showEndAnim, setShowEndAnim] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);

  // Start game on mount
  useEffect(() => {
    playGameStart();
    startGame(names);
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

  // Trigger end-game animation on phase transition to game_over
  useEffect(() => {
    if (!gameState) return;
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = gameState.phase;
    if (gameState.phase === 'game_over' && prev !== 'game_over') {
      const t = setTimeout(() => setShowEndAnim(true), 0);
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
      } else {
        aiTurn(difficulty);
      }
    }, 850);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [gameState, aiTurn, initialReveal, difficulty]);

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
        className="w-full flex-1 flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-1 sm:gap-2 relative z-10 min-h-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <GameTopBar gs={gs} />

        {/* Mobile fixed message overlay — must NOT use display in inline style */}
        <div
          className="visible sm:invisible flex justify-center pointer-events-none"
          style={{ zIndex: 45, padding: '0 0 0 12px' }}
        >
          <GameMessage message={gs.message} compact />
        </div>

        {/* Settings FAB — mobile only */}
        {!isModalOpen && (
          <motion.button
            className="visible sm:invisible"
            onClick={() => setShowMenu(true)}
            style={{
              position: 'fixed',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              right: 16,
              zIndex: 60,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(10, 4, 30, 0.95)',
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
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>⚙</span>
          </motion.button>
        )}

        <ScoreModal
          isOpen={!showEndAnim && isModalOpen}
          players={gs.players}
          roundNumber={gs.roundNumber}
          isGameOver={gs.phase === 'game_over'}
          onNewRound={() => { playButtonClick(); newRound(); }}
          onNewGame={() => { playButtonClick(); onBackToMenu(); }}
          onQuit={() => { playButtonClick(); onBackToMenu(); }}
        />

        {/* All players status bar (human + AI) */}
        <PlayersBar
          players={gs.players}
          currentPlayerIndex={gs.currentPlayerIndex}
          gamePhase={gs.phase}
        />

        {/* Deck / Discard */}
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

        {/* Human board only — label suppressed, shown in PlayersBar */}
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

        <GameMenu
          isOpen={showMenu}
          onResume={() => setShowMenu(false)}
          onQuit={() => { playButtonClick(); onBackToMenu(); }}
        />
      </motion.div>
    </>
  );
}
