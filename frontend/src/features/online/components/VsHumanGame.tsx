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
      className="w-full flex-1 flex flex-col items-center px-2 sm:px-4 py-2 sm:py-2 relative z-10 min-h-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Modals & overlays — outside the layout flow */}
      <ScoreModal
        isOpen={isModalOpen}
        players={gs.players}
        roundNumber={gs.roundNumber}
        isGameOver={gs.phase === 'game_over'}
        onNewRound={gs.phase === 'round_end' ? () => { playButtonClick(); newRound(); } : undefined}
        onNewGame={gs.phase === 'game_over' ? () => { playButtonClick(); disconnect(); onBackToMenu(); } : undefined}
        onQuit={() => { playButtonClick(); disconnect(); onBackToMenu(); }}
      />

      <GameMenu
        isOpen={showMenu}
        onResume={() => setShowMenu(false)}
        onQuit={() => { disconnect(); onBackToMenu(); }}
      />

      <ProgressionToast update={progressionUpdate} onDismiss={clearProgressionUpdate} />

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

        {/* 3. Noms des participants */}
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

      </div>
    </motion.div>
  );
}
