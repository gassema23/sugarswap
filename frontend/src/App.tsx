import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from './hooks/useGame';
import { useOnlineGame } from './hooks/useOnlineGame';
import Background from './components/Background';
import Logo from './components/Logo';
import PlayerBoard from './components/PlayerBoard';
import DeckDiscard from './components/DeckDiscard';
import ScoreModal from './components/ScoreModal';
import GameMessage from './components/GameMessage';
import HelpButton from './components/HelpButton';
import GameMenu from './components/GameMenu';
import OnlineLobby from './components/OnlineLobby';
import RulesModal from './components/RulesModal';
import GameIcon from './components/GameIcon';
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
import type { GameState, GamePhase, Player } from './engine/types';

// ─── App mode ─────────────────────────────────────────────────────────────────
type AppMode = 'menu' | 'vs_ai_setup' | 'vs_ai' | 'vs_human';

// ─── Responsive card sizes ────────────────────────────────────────────────────
function useCardSizes() {
  const get = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Desktop / tablet — width drives sizing, height not a concern
    if (w >= 1024) return { human: 80, me: 80, deck: 68, showAiLabel: true };
    if (w >= 640)  return { human: 70, me: 70, deck: 58, showAiLabel: true };

    // Mobile (flex-col): both boards + deck must fit in viewport height.
    // Overhead: topBar(~90px logo+round+msg) + helpBtn(~44px) + outer py/gap(~28px) + inner row gaps(~24px) + deck(~100px) = ~286px
    const boardsAvail = Math.max(0, h - 286);
    // Per board: label(34px) + grid-padding(16px) + inner-gaps(12px) + cardH*3
    //   cardH = cardW * 1.35  →  board = 62 + cardW * 4.05
    // 2 boards total: 2*(62 + cardW*4.05)  →  cardW = (boardsAvail/2 - 62) / 4.05
    const maxFromH  = Math.floor((boardsAvail / 2 - 62) / 4.05);
    const maxFromW  = w < 400 ? 42 : 50;

    const human = Math.max(28, Math.min(maxFromW, maxFromH));
    const deck  = Math.max(26, Math.min(w < 400 ? 38 : 44, Math.floor(maxFromH * 0.9)));

    return { human, me: human, deck, showAiLabel: false };
  };
  const [sizes, setSizes] = useState(get);
  useEffect(() => {
    const handler = () => setSizes(get());
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return sizes;
}

// ─── Shared top bar (used by GameView + VsHumanGame) ─────────────────────────
function GameTopBar({ gs }: { gs: GameState }) {
  const roundLabel = (
    <motion.div
      style={{
        fontFamily: 'var(--font-game)',
        fontSize: 'clamp(1rem, 3vw, 1.35rem)',
        fontWeight: 900,
        color: '#FFD700',
        textShadow: '0 0 16px rgba(255,215,0,0.55), 0 2px 6px rgba(0,0,0,0.5)',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <GameIcon name="fruit" size={18} />
        Manche {gs.roundNumber}
        <GameIcon name="fruit" size={18} />
      </span>
    </motion.div>
  );

  return (
    <div className="w-full max-w-6xl flex flex-col items-center gap-1 sm:gap-2">
      <Logo size="xl" />
      <div className="flex justify-center w-full -mt-1 sm:-mt-2">
        {roundLabel}
      </div>
      <div className="flex justify-center w-full">
        <GameMessage message={gs.message} />
      </div>
    </div>
  );
}

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
        if (message.includes('DOUBLÉ')) {
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

// ─── Mode selection menu ──────────────────────────────────────────────────────
function ModeMenu({ onSelect, onRules }: { onSelect: (m: AppMode) => void; onRules: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <Logo size="lg" />
      <div
        className="flex flex-col gap-4 items-center rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(180,50,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,100,50,0.06) 0%, transparent 60%), linear-gradient(165deg, rgba(28,8,68,0.97) 0%, rgba(10,4,30,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          border: '2px solid rgba(255,205,0,0.65)',
          boxShadow: '0 0 0 1px rgba(160,90,0,0.38), 0 0 55px rgba(160,60,255,0.12), 0 26px 70px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,220,100,0.32), inset 0 -1px 0 rgba(0,0,0,0.45)',
          width: 'min(calc(100vw - 32px), 320px)',
          padding: '28px 22px',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-game)',
          margin: 0,
          fontSize: '1.45rem',
          letterSpacing: '0.03em',
          background: 'linear-gradient(135deg, #FFE866 0%, #FFD700 45%, #FFAA00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 1px 8px rgba(255,170,0,0.55))',
        }}>
          Comment jouer ?
        </h2>

        <button
          className="btn-candy w-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 48%), linear-gradient(135deg, #E91E63 0%, #FF6B1A 100%)',
            fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onClick={() => { playButtonClick(); onSelect('vs_ai'); }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="9" width="16" height="11" rx="3" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.2)"/>
            <rect x="8.5" y="4" width="7" height="5.5" rx="1.5" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.2)"/>
            <line x1="12" y1="4" x2="12" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="9" cy="14" r="1.8" fill="white"/>
            <circle cx="15" cy="14" r="1.8" fill="white"/>
            <path d="M9.5 17.5 Q12 19.2 14.5 17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <line x1="4" y1="13" x2="2" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="20" y1="13" x2="22" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Contre l&apos;IA
        </button>

        <button
          className="btn-candy w-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 48%), linear-gradient(135deg, #7B1FA2 0%, #0288D1 100%)',
            fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onClick={() => { playButtonClick(); onSelect('vs_human'); }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.1)"/>
            <path d="M12 3C9.5 6.5 8.5 9.2 8.5 12C8.5 14.8 9.5 17.5 12 21C14.5 17.5 15.5 14.8 15.5 12C15.5 9.2 14.5 6.5 12 3Z" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.1)"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="3" y1="15" x2="21" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          En ligne (2–8 joueurs)
        </button>

        <button
          className="btn-candy"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 48%), linear-gradient(135deg, #00ACC1 0%, #1976D2 100%)',
            fontSize: '0.9rem',
            padding: '0.45rem 1.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onClick={() => { playButtonClick(); onRules(); }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6C4 4.9 4.9 4 6 4H19V20H6C4.9 20 4 19.1 4 18V6Z" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.15)"/>
            <path d="M4 18C4 16.9 4.9 16 6 16H19" stroke="white" strokeWidth="1.8"/>
            <line x1="8" y1="9" x2="15" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="8" y1="12.5" x2="13" y2="12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Règles
        </button>
      </div>
    </motion.div>
  );
}

// ─── VS AI setup screen ───────────────────────────────────────────────────────
function VsAiSetup({ onStart }: { onStart: (names: string[]) => void }) {
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
          width: 'min(calc(100vw - 32px), 310px)',
          fontFamily: 'var(--font-game)',
        }}
      >
        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem', textShadow: '0 0 10px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <GameIcon name="robot" size={26} />
          Contre l&apos;IA
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
          style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => { playButtonClick(); onStart([p1 || 'Joueur 1', p2 || 'IA Sucrée']); }}
        >
          <GameIcon name="play" size={24} />
          Jouer !
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
  onBack: () => void;
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
  onBack,
}: GameViewProps) {
  const sizes       = useCardSizes();
  const topDiscard  = gs.discardPile[gs.discardPile.length - 1] ?? null;
  const humanPlayer = gs.players.find(p => p.isHuman);
  const aiPlayer    = gs.players.find(p => !p.isHuman);
  const [showMenu, setShowMenu] = useState(false);

  const isModalOpen = gs.phase === 'round_end' || gs.phase === 'game_over';

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (isModalOpen) return;
      setShowMenu(v => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

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
      className="w-full flex-1 flex flex-col items-center px-2 sm:px-4 py-1 sm:py-2 gap-1 sm:gap-2 relative z-10 min-h-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <GameTopBar gs={gs} />

      <ScoreModal
        isOpen={gs.phase === 'round_end' || gs.phase === 'game_over'}
        players={gs.players}
        roundNumber={gs.roundNumber}
        isGameOver={gs.phase === 'game_over'}
        onNewRound={onNewRound}
        onNewGame={onNewGame}
        onQuit={onBack}
      />

      {/*
        ── Responsive 3-column layout ───────────────────────────────────────
        Desktop (flex-row): Human LEFT | Deck CENTER | AI RIGHT
        Mobile  (flex-col): AI TOP | Deck MIDDLE | Human BOTTOM
        CSS order handles the swap without duplicating JSX.
      */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 lg:gap-8 w-full max-w-6xl flex-1 min-h-0">

        {/* HUMAN – left on desktop, bottom on mobile */}
        {humanPlayer && (
          <div className="order-3 sm:order-1 flex justify-center">
            <PlayerBoard
              player={humanPlayer}
              isActive={isHumanTurn && gs.phase !== 'round_end' && gs.phase !== 'game_over'}
              isHuman={true}
              turnPhase={gs.turnPhase}
              gamePhase={gs.phase}
              onCardClick={onCardClick}
              cardSize={sizes.human}
            />
          </div>
        )}

        {/* DECK / DISCARD – always center */}
        <div className="order-1 sm:order-2 flex justify-center">
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
            cardSize={sizes.deck}
          />
        </div>

        {/* AI – right on desktop, visible on all screens */}
        {aiPlayer && (
          <div className="flex order-2 sm:order-3 justify-center">
            <PlayerBoard
              player={aiPlayer}
              isActive={!isHumanTurn && gs.phase !== 'round_end' && gs.phase !== 'game_over'}
              isHuman={false}
              turnPhase={gs.turnPhase}
              gamePhase={gs.phase}
              cardSize={sizes.human}
              showLabel={true}
            />
          </div>
        )}

      </div>

      <HelpButton
        gamePhase={gs.phase}
        turnPhase={gs.turnPhase}
        isHumanTurn={isHumanTurn}
        hasDrawnCard={!!gs.drawnCard}
      />

      <GameMenu
        isOpen={showMenu}
        onResume={() => setShowMenu(false)}
        onQuit={onBack}
      />
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
      onBack={() => { playButtonClick(); onBackToMenu(); }}
    />
  );
}

// ─── Compact players status bar (online multi-player) ────────────────────────
function OnlinePlayersBar({
  players,
  currentPlayerIndex,
  gamePhase,
}: {
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: GamePhase;
}) {
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

// ─── VS HUMAN (online) game controller ───────────────────────────────────────
function VsHumanGame({ onBackToMenu }: { onBackToMenu: () => void }) {
  const {
    gameState, status, roomCode, players, maxPlayers, playerIndex, errorMsg,
    createRoom, joinRoom, startOnlineGame,
    initialReveal, drawDiscard, drawDeck, discardCard,
    swapCard, revealCard, newRound, disconnect,
  } = useOnlineGame();

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

      <ScoreModal
        isOpen={gs.phase === 'round_end' || gs.phase === 'game_over'}
        players={gs.players}
        roundNumber={gs.roundNumber}
        isGameOver={gs.phase === 'game_over'}
        onNewRound={gs.phase === 'round_end' ? () => { playButtonClick(); newRound(); } : undefined}
        onNewGame={gs.phase === 'game_over' ? () => { playButtonClick(); disconnect(); onBackToMenu(); } : undefined}
        onQuit={() => { playButtonClick(); disconnect(); onBackToMenu(); }}
      />

      {/* Compact players status bar */}
      <OnlinePlayersBar players={gs.players} currentPlayerIndex={gs.currentPlayerIndex} gamePhase={gs.phase} />

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

      {/* My board only — label suppressed, already shown in OnlinePlayersBar */}
      {mePlayer && (
        <PlayerBoard
          player={mePlayer}
          isActive={isHumanTurn && gs.phase !== 'round_end' && gs.phase !== 'game_over'}
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
    </motion.div>
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
    <div className="flex flex-col items-center relative" style={{ fontFamily: 'var(--font-game)', overflow: 'hidden', height: '100dvh' }}>
      <Background />

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <AnimatePresence mode="wait">
        {mode === 'menu' && (
          <motion.div key="menu" className="flex-1 flex items-center justify-center" exit={{ opacity: 0, scale: 0.9 }}>
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
          <motion.div key="setup" className="flex-1 flex items-center justify-center" exit={{ opacity: 0, scale: 0.9 }}>
            <VsAiSetup
              onStart={handleVsAiStart}
            />
          </motion.div>
        )}

        {mode === 'vs_ai' && names.length > 0 && (
          <motion.div key="vsai" className="flex-1 flex min-h-0 w-full" exit={{ opacity: 0 }}>
            <VsAiGame names={names} onBackToMenu={() => setMode('menu')} />
          </motion.div>
        )}

        {mode === 'vs_human' && (
          <motion.div key="vshuman" className="flex-1 flex min-h-0 w-full" exit={{ opacity: 0 }}>
            <VsHumanGame onBackToMenu={() => setMode('menu')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
