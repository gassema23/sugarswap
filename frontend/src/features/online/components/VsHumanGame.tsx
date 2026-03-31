import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOnlineGame } from '@/features/online';
import { useCardSizes } from '@/shared/hooks/useCardSizes';
import { useSoundEffects } from '@/shared/hooks/useSoundEffects';
import GameTopBar from '@/shared/components/GameTopBar';
import PlayersBar from '@/shared/components/PlayersBar';
import PlayerBoard from '@/components/PlayerBoard';
import DeckDiscard from '@/components/DeckDiscard';
import ScoreModal from '@/components/ScoreModal';
import GameMessage from '@/components/GameMessage';
import HelpButton from '@/components/HelpButton';
import GameMenu from '@/components/GameMenu';
import OnlineLobby from '@/components/OnlineLobby';
import ProgressionToast from '@/components/ProgressionToast';
import type { AuthUser } from '@/hooks/useAuth';
import {
  playButtonClick,
  playDrawDeck,
  playDrawDiscard,
  playDiscard,
  playSwapCard,
} from '@/utils/sounds';

interface VsHumanGameProps {
  onBackToMenu: () => void;
  token:           string | null;
  authUser:        AuthUser | null;
  authLoading:     boolean;
  onLoginGoogle:   () => void;
  onLoginFacebook: () => void;
  onLogout:        () => void;
}

export default function VsHumanGame({
  onBackToMenu,
  token,
  authUser,
  authLoading,
  onLoginGoogle,
  onLoginFacebook,
  onLogout,
}: VsHumanGameProps) {
  const {
    gameState, status, roomCode, players, maxPlayers, playerIndex, errorMsg,
    progressionUpdate, clearProgressionUpdate,
    createRoom, joinRoom, startOnlineGame,
    initialReveal, drawDiscard, drawDeck, discardCard,
    swapCard, revealCard, newRound, disconnect,
  } = useOnlineGame(token);

  useSoundEffects(gameState);
  const sizes = useCardSizes();
  const [showMenu, setShowMenu] = useState(false);

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

  const isLobbyState = (
    status === 'idle' || status === 'connecting' || status === 'waiting' ||
    status === 'ready' || status === 'error' ||
    status === 'player_disconnected' || status === 'opponent_disconnected'
  );

  if (isLobbyState) {
    return (
      <div className="flex items-center justify-center w-full">
        <OnlineLobby
          status={status}
          roomCode={roomCode}
          players={players}
          maxPlayers={maxPlayers}
          playerIndex={playerIndex}
          errorMsg={errorMsg}
          authUser={authUser}
          authLoading={authLoading}
          onLoginGoogle={onLoginGoogle}
          onLoginFacebook={onLoginFacebook}
          onLogout={onLogout}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartGame={startOnlineGame}
          onBack={() => { disconnect(); onBackToMenu(); }}
        />
      </div>
    );
  }

  if (!gameState) return null;
  const gs          = gameState;
  const isHumanTurn = gs.players[gs.currentPlayerIndex].isHuman;
  const mePlayer    = gs.players.find(p => p.isHuman);
  const topDiscard  = gs.discardPile[gs.discardPile.length - 1] ?? null;
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
    <motion.div
      key="online-game"
      className="w-full flex-1 flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-1 sm:gap-2 relative z-10 min-h-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GameTopBar gs={gs} />

      {/* Mobile fixed message overlay */}
      <div
        className="visible sm:invisible flex justify-center pointer-events-none"
        style={{ zIndex: 45, padding: '0 0 0 12px' }}
      >
        <GameMessage message={gs.message} compact />
      </div>

      <ScoreModal
        isOpen={isModalOpen}
        players={gs.players}
        roundNumber={gs.roundNumber}
        isGameOver={gs.phase === 'game_over'}
        onNewRound={gs.phase === 'round_end' ? () => { playButtonClick(); newRound(); } : undefined}
        onNewGame={gs.phase === 'game_over' ? () => { playButtonClick(); disconnect(); onBackToMenu(); } : undefined}
        onQuit={() => { playButtonClick(); disconnect(); onBackToMenu(); }}
      />

      {/* All players status bar */}
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

      {/* My board only — label suppressed, already shown in PlayersBar */}
      {mePlayer && (
        <PlayerBoard
          player={mePlayer}
          isActive={isHumanTurn && !isModalOpen}
          isHuman={true}
          turnPhase={gs.turnPhase}
          gamePhase={gs.phase}
          onCardClick={handleCardClick}
          cardSize={sizes.me}
          showLabel={false}
        />
      )}

      <HelpButton
        gamePhase={gs.phase}
        turnPhase={gs.turnPhase}
        isHumanTurn={isHumanTurn}
        hasDrawnCard={!!gs.drawnCard}
      />

      <GameMenu
        isOpen={showMenu}
        onResume={() => setShowMenu(false)}
        onQuit={() => { disconnect(); onBackToMenu(); }}
      />

      <ProgressionToast update={progressionUpdate} onDismiss={clearProgressionUpdate} />
    </motion.div>
  );
}
