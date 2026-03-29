import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from './hooks/useGame';
import { useOnlineGame } from './hooks/useOnlineGame';
import Background from './components/Background';
import Logo from './components/Logo';
import PlayerBoard from './components/PlayerBoard';
import DeckDiscard from './components/DeckDiscard';
import ScoreBoard from './components/ScoreBoard';
import GameMessage from './components/GameMessage';
import OnlineLobby from './components/OnlineLobby';
import RulesModal from './components/RulesModal';
import {
  playButtonClick,
  playDrawDeck,
  playDrawDiscard,
  playDiscard, 
  playSwapCard,
  playColumnEliminated,
  playTurnStart,
  playRoundEnd,
  playScoreDoubled,
  playVictory,
  playDefeat,
  playGameStart,
} from './utils/sounds';
import type { GameState } from './engine/types';

// ─── App mode ─────────────────────────────────────────────────────────────────
type AppMode = 'menu' | 'vs_ai_setup' | 'vs_ai' | 'vs_human';

// ─── Sound side-effects hook (shared by both vs_ai and vs_human) ──────────────
function useSoundEffects(gameState: GameState | null) {
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
        message.includes('DOUBLÉ') ? setTimeout(playScoreDoubled, 600) : playRoundEnd();
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

// ─── Mode selection menu ──────────────────────────────────────────────────────
function ModeMenu({ onSelect, onRules }: { onSelect: (m: AppMode) => void; onRules: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <Logo size="lg" />
      <div
        className="flex flex-col gap-3 items-center p-6 rounded-2xl"
        style={{
          background: 'rgba(0,0,0,0.38)',
          backdropFilter: 'blur(14px)',
          border: '2px solid rgba(255,215,0,0.35)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          minWidth: 260,
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-game)', color: '#FFD700', margin: 0, fontSize: '1.3rem', textShadow: '0 0 12px rgba(255,215,0,0.5)' }}>
          Comment jouer ?
        </h2>

        <button
          className="btn-candy w-full"
          style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)', fontSize: '1rem' }}
          onClick={() => { playButtonClick(); onSelect('vs_ai'); }}
        >
          🤖 Contre l'IA
        </button>

        <button
          className="btn-candy w-full"
          style={{ background: 'linear-gradient(135deg,#9C27B0,#03A9F4)', fontSize: '1rem' }}
          onClick={() => { playButtonClick(); onSelect('vs_human'); }}
        >
          🌐 En ligne (2 joueurs)
        </button>

        <button
          className="btn-candy"
          style={{
            background: 'linear-gradient(135deg, #00BCD4, #26C6DA)',
            border: '2px solid #FFD700',
            boxShadow: '0 0 10px rgba(0,188,212,0.45)',
            fontSize: '0.82rem',
            padding: '0.35rem 1.4rem',
            marginTop: '2px',
          }}
          onClick={() => { playButtonClick(); onRules(); }}
        >
          📖 Règles
        </button>
      </div>
    </motion.div>
  );
}

// ─── VS AI setup screen ───────────────────────────────────────────────────────
function VsAiSetup({ onStart, onBack }: { onStart: (names: string[]) => void; onBack: () => void }) {
  const [p1, setP1] = useState('Joueur 1');
  const [p2, setP2] = useState('IA Sucrée');
  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-game)',
    background: 'rgba(255,255,255,0.22)',
    border: '2px solid rgba(255,215,0,0.5)',
    borderRadius: '999px',
    padding: '0.45rem 1rem',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    textAlign: 'center',
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <Logo size="md" />
      <div
        className="flex flex-col gap-3 p-6 rounded-2xl items-center"
        style={{
          background: 'rgba(0,0,0,0.38)',
          backdropFilter: 'blur(14px)',
          border: '2px solid rgba(255,215,0,0.35)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          minWidth: 270,
          fontFamily: 'var(--font-game)',
        }}
      >
        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
          🤖 Contre l'IA
        </h2>
        <div className="flex flex-col gap-2 w-full">
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Ton prénom</label>
          <input style={inputStyle} value={p1} onChange={e => setP1(e.target.value)} placeholder="Joueur 1" />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Nom de l'IA</label>
          <input style={inputStyle} value={p2} onChange={e => setP2(e.target.value)} placeholder="IA Sucrée" />
        </div>
        <button
          className="btn-candy w-full mt-1"
          style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)', fontSize: '1rem' }}
          onClick={() => { playButtonClick(); onStart([p1 || 'Joueur 1', p2 || 'IA Sucrée']); }}
        >
          🍭 Jouer !
        </button>
        <button
          style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-game)', fontSize: '0.8rem' }}
          onClick={() => { playButtonClick(); onBack(); }}
        >
          ← Retour
        </button>
      </div>
    </motion.div>
  );
}

// ─── Shared game view (used by both vs_ai and vs_human) ───────────────────────
interface GameViewProps {
  gameState: GameState;
  isHumanTurn: boolean;
  onCardClick: (r: number, c: number) => void;
  onDrawDeck: () => void;
  onDrawDiscard: () => void;
  onDiscardCard: () => void;
  onNewRound?: () => void;
  onNewGame: () => void;
}

function GameView({
  gameState: gs,
  isHumanTurn,
  onCardClick,
  onDrawDeck,
  onDrawDiscard,
  onDiscardCard,
  onNewRound,
  onNewGame,
}: GameViewProps) {
  const topDiscard  = gs.discardPile[gs.discardPile.length - 1] ?? null;
  const humanPlayer = gs.players.find(p => p.isHuman);
  const aiPlayer    = gs.players.find(p => !p.isHuman);

  const canDrawDiscard =
    isHumanTurn && gs.turnPhase === 'draw' &&
    (gs.phase === 'playing' || gs.phase === 'last_round') &&
    gs.discardPile.length > 0;

  const canDrawDeck =
    isHumanTurn && gs.turnPhase === 'draw' &&
    (gs.phase === 'playing' || gs.phase === 'last_round');

  const canDiscardDrawn =
    isHumanTurn && gs.turnPhase === 'discard_or_swap' && !!gs.drawnCard;

  return (
    <motion.div
      key="game"
      className="w-full flex flex-col items-center px-4 py-2 gap-2 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Top bar */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <div
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Manche {gs.roundNumber}
          </div>
        </div>
        <GameMessage message={gs.message} />
        <ScoreBoard
          players={gs.players}
          roundNumber={gs.roundNumber}
          isGameOver={gs.phase === 'game_over'}
          onNewRound={gs.phase === 'round_end' ? onNewRound : undefined}
          onNewGame={gs.phase === 'game_over' ? onNewGame : undefined}
        />
      </div>

      {/* Main row */}
      <div className="flex items-center justify-center gap-6 flex-1">
        {aiPlayer && (
          <PlayerBoard
            player={aiPlayer}
            isActive={!isHumanTurn && gs.phase !== 'round_end' && gs.phase !== 'game_over'}
            isHuman={false}
            turnPhase={gs.turnPhase}
            gamePhase={gs.phase}
            cardSize={60}
          />
        )}
        <DeckDiscard
          deckCount={gs.deck.length}
          topDiscard={topDiscard}
          drawnCard={gs.drawnCard}
          canDrawDiscard={canDrawDiscard}
          canDrawDeck={canDrawDeck}
          canDiscardDrawn={canDiscardDrawn}
          onDrawDiscard={onDrawDiscard}
          onDrawDeck={onDrawDeck}
          onDiscardDrawn={onDiscardCard}
        />
        {humanPlayer && (
          <PlayerBoard
            player={humanPlayer}
            isActive={isHumanTurn && gs.phase !== 'round_end' && gs.phase !== 'game_over'}
            isHuman={true}
            turnPhase={gs.turnPhase}
            gamePhase={gs.phase}
            onCardClick={onCardClick}
            cardSize={68}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── VS AI game controller ────────────────────────────────────────────────────
function VsAiGame({ names, onBackToMenu }: { names: string[]; onBackToMenu: () => void }) {
  const {
    gameState, startGame, initialReveal,
    drawDiscard, drawDeck, discardCard,
    swapCard, revealCard, newRound, aiTurn,
  } = useGame();

  useSoundEffects(gameState);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start game on mount
  useEffect(() => {
    playGameStart();
    startGame(names);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        aiTurn();
      }
    }, 850);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [gameState, aiTurn, initialReveal]);

  if (!gameState) return null;
  const gs = gameState;
  const isHumanTurn = gs.players[gs.currentPlayerIndex].isHuman;

  function handleCardClick(row: number, col: number) {
    const { phase, turnPhase, currentPlayerIndex } = gs;
    if (phase === 'initial_reveal') { initialReveal(currentPlayerIndex, row, col); return; }
    if (turnPhase === 'discard_or_swap') { playSwapCard(); swapCard(row, col); return; }
    if (turnPhase === 'reveal_hidden') { revealCard(row, col); }
  }

  return (
    <GameView
      gameState={gs}
      isHumanTurn={isHumanTurn}
      onCardClick={handleCardClick}
      onDrawDeck={() => { playDrawDeck(); drawDeck(); }}
      onDrawDiscard={() => { playDrawDiscard(); drawDiscard(); }}
      onDiscardCard={() => { playDiscard(); discardCard(); }}
      onNewRound={() => { playButtonClick(); newRound(); }}
      onNewGame={() => { playButtonClick(); onBackToMenu(); }}
    />
  );
}

// ─── VS HUMAN (online) game controller ───────────────────────────────────────
function VsHumanGame({ onBackToMenu }: { onBackToMenu: () => void }) {
  const {
    gameState, status, roomCode, opponentName, errorMsg,
    createRoom, joinRoom,
    initialReveal, drawDiscard, drawDeck, discardCard,
    swapCard, revealCard, newRound, disconnect,
  } = useOnlineGame();

  useSoundEffects(gameState);

  if (status === 'idle' || status === 'connecting' || status === 'waiting' ||
      status === 'ready' || status === 'error' || status === 'opponent_disconnected') {
    return (
      <div className="flex items-center justify-center w-full">
        <OnlineLobby
          status={status}
          roomCode={roomCode}
          opponentName={opponentName}
          errorMsg={errorMsg}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onBack={() => { disconnect(); onBackToMenu(); }}
        />
      </div>
    );
  }

  if (!gameState) return null;
  const gs = gameState;
  const isHumanTurn = gs.players[gs.currentPlayerIndex].isHuman;

  function handleCardClick(row: number, col: number) {
    const { phase, turnPhase, currentPlayerIndex } = gs;
    if (phase === 'initial_reveal') { initialReveal(currentPlayerIndex, row, col); return; }
    if (turnPhase === 'discard_or_swap') { playSwapCard(); swapCard(row, col); return; }
    if (turnPhase === 'reveal_hidden') { revealCard(row, col); }
  }

  return (
    <GameView
      gameState={gs}
      isHumanTurn={isHumanTurn}
      onCardClick={handleCardClick}
      onDrawDeck={() => { playDrawDeck(); drawDeck(); }}
      onDrawDiscard={() => { playDrawDiscard(); drawDiscard(); }}
      onDiscardCard={() => { playDiscard(); discardCard(); }}
      onNewRound={() => { playButtonClick(); newRound(); }}
      onNewGame={() => { playButtonClick(); disconnect(); onBackToMenu(); }}
    />
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]         = useState<AppMode>('menu');
  const [names, setNames]       = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);

  function handleVsAiStart(n: string[]) {
    setNames(n);
    setMode('vs_ai');
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center relative" style={{ fontFamily: 'var(--font-game)' }}>
      <Background />

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <AnimatePresence mode="wait">
        {mode === 'menu' && (
          <motion.div key="menu" exit={{ opacity: 0, scale: 0.9 }}>
            <ModeMenu
              onSelect={m => {
                if (m === 'vs_ai') setMode('vs_ai_setup');
                else setMode('vs_human');
              }}
              onRules={() => setShowRules(true)}
            />
          </motion.div>
        )}

        {(mode as string) === 'vs_ai_setup' && (
          <motion.div key="setup" exit={{ opacity: 0, scale: 0.9 }}>
            <VsAiSetup
              onStart={handleVsAiStart}
              onBack={() => setMode('menu')}
            />
          </motion.div>
        )}

        {mode === 'vs_ai' && names.length > 0 && (
          <motion.div key="vsai" className="w-full h-full flex" exit={{ opacity: 0 }}>
            <VsAiGame names={names} onBackToMenu={() => setMode('menu')} />
          </motion.div>
        )}

        {mode === 'vs_human' && (
          <motion.div key="vshuman" className="w-full h-full flex" exit={{ opacity: 0 }}>
            <VsHumanGame onBackToMenu={() => setMode('menu')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
