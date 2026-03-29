import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OnlineStatus } from '../hooks/useOnlineGame';
import { playButtonClick } from '../utils/sounds';

interface Props {
  status:          OnlineStatus;
  roomCode:        string | null;
  players:         string[];         // all connected players (including self)
  maxPlayers:      number;
  playerIndex:     number | null;    // local player's index (0 = host)
  errorMsg:        string | null;
  onCreateRoom:    (name: string, maxPlayers: number) => void;
  onJoinRoom:      (code: string, name: string) => void;
  onStartGame:     () => void;       // host early-start (when ≥ 2, room not full)
  onBack:          () => void;
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-game)',
  background: 'rgba(255,255,255,0.2)',
  border: '2px solid rgba(255,215,0,0.5)',
  borderRadius: '999px',
  padding: '0.45rem 1rem',
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
  width: '100%',
  textAlign: 'center',
};

export default function OnlineLobby({
  status,
  roomCode,
  players,
  maxPlayers,
  playerIndex,
  errorMsg,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onBack,
}: Props) {
  const [name, setName]           = useState('');
  const [code, setCode]           = useState('');
  const [tab, setTab]             = useState<'create' | 'join'>('create');
  const [selectedMax, setSelectedMax] = useState(2);

  const isHost     = playerIndex === 0;
  const canStart   = isHost && players.length >= 2;

  function handleCreate() {
    if (!name.trim()) return;
    playButtonClick();
    onCreateRoom(name.trim(), selectedMax);
  }

  function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    playButtonClick();
    onJoinRoom(code.trim(), name.trim());
  }

  // ── Waiting for players ──────────────────────────────────────────────────
  if (status === 'waiting') {
    return (
      <LobbyCard>
        <div className="text-3xl mb-1">⏳</div>
        <h3 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem' }}>
          {isHost ? 'En attente de joueurs…' : 'En attente de la partie…'}
        </h3>

        {/* Room code (only host shares it) */}
        {isHost && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '4px 0 8px' }}>
              Partage ce code à tes amis :
            </p>
            <div
              className="px-5 py-2 rounded-2xl text-3xl font-bold tracking-widest select-all cursor-pointer"
              style={{
                background: 'rgba(255,215,0,0.15)',
                border: '2px solid rgba(255,215,0,0.6)',
                color: '#FFD700',
                letterSpacing: '0.25em',
              }}
              onClick={() => navigator.clipboard?.writeText(roomCode ?? '')}
              title="Cliquer pour copier"
            >
              {roomCode}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: 4 }}>
              Cliquer pour copier
            </p>
          </>
        )}

        {/* Connected players list */}
        <div className="w-full mt-2">
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: 6, textAlign: 'center' }}>
            Joueurs connectés ({players.length}/{maxPlayers})
          </p>
          <div className="flex flex-col gap-1">
            {players.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <span style={{ fontSize: '0.8rem' }}>{i === 0 ? '👑' : '👤'}</span>
                <span style={{ color: i === playerIndex ? '#FFD700' : 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                  {p}{i === playerIndex ? ' (toi)' : ''}
                </span>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-2 px-3 py-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}
              >
                <span style={{ fontSize: '0.8rem' }}>⬜</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  En attente…
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Host early-start button */}
        {canStart && players.length < maxPlayers && (
          <button
            className="btn-candy w-full mt-2"
            style={{ background: 'linear-gradient(135deg,#4CAF50,#03A9F4)', fontSize: '0.9rem' }}
            onClick={() => { playButtonClick(); onStartGame(); }}
          >
            🎮 Démarrer ({players.length} joueurs)
          </button>
        )}

        {!canStart && <Spinner />}

        <button
          className="mt-2 text-sm"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-game)' }}
          onClick={() => { playButtonClick(); onBack(); }}
        >
          ← Retour
        </button>
      </LobbyCard>
    );
  }

  // ── All players joined → host starting game ───────────────────────────────
  if (status === 'ready') {
    return (
      <LobbyCard>
        <div className="text-3xl mb-1">🎉</div>
        <h3 style={{ color: '#4CAF50', margin: 0, fontSize: '1.1rem' }}>
          Tous les joueurs sont prêts !
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 6 }}>
          La partie commence…
        </p>
        <Spinner color="#4CAF50" />
      </LobbyCard>
    );
  }

  // ── Connecting ────────────────────────────────────────────────────────────
  if (status === 'connecting') {
    return (
      <LobbyCard>
        <Spinner />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Connexion…</p>
      </LobbyCard>
    );
  }

  // ── Disconnected ──────────────────────────────────────────────────────────
  if (status === 'player_disconnected' || status === 'opponent_disconnected') {
    return (
      <LobbyCard>
        <div className="text-3xl mb-1">🔌</div>
        <h3 style={{ color: '#FF5722', margin: 0 }}>Un joueur s'est déconnecté</h3>
        <button
          className="btn-candy mt-4"
          style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)' }}
          onClick={onBack}
        >
          Retour au menu
        </button>
      </LobbyCard>
    );
  }

  // ── Default: Create / Join form ───────────────────────────────────────────
  return (
    <LobbyCard>
      <h3 style={{ color: '#FFD700', margin: '0 0 12px', fontSize: '1.3rem' }}>
        🌐 Jouer en ligne
      </h3>

      {/* Tab selector */}
      <div className="flex gap-2 mb-4">
        {(['create', 'join'] as const).map(t => (
          <button
            key={t}
            className="btn-candy"
            style={{
              background: tab === t
                ? 'linear-gradient(135deg, #E91E63, #FF9800)'
                : 'rgba(255,255,255,0.15)',
              border: tab === t ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.2)',
              fontSize: '0.85rem',
              padding: '0.35rem 1rem',
            }}
            onClick={() => { setTab(t); playButtonClick(); }}
          >
            {t === 'create' ? '✨ Créer' : '🔑 Rejoindre'}
          </button>
        ))}
      </div>

      {/* Your name */}
      <div className="flex flex-col gap-1 w-full mb-3">
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Ton prénom</label>
        <input
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Alice"
          maxLength={20}
        />
      </div>

      <AnimatePresence mode="wait">
        {tab === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            {/* Number of players */}
            <div className="flex flex-col gap-1 w-full">
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                Nombre de joueurs (2–8)
              </label>
              <select
                value={selectedMax}
                onChange={e => { setSelectedMax(Number(e.target.value)); playButtonClick(); }}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n} style={{ background: '#1a1a2e', color: 'white' }}>
                    {n} joueurs
                  </option>
                ))}
              </select>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textAlign: 'center', margin: 0 }}>
              Un code sera généré — partage-le à tes amis.
            </p>
            <button
              className="btn-candy w-full"
              style={{ background: 'linear-gradient(135deg,#4CAF50,#03A9F4)' }}
              onClick={handleCreate}
            >
              Créer la partie
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-3 w-full"
          >
            <div className="flex flex-col gap-1">
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Code de la partie</label>
              <input
                style={{ ...inputStyle, letterSpacing: '0.2em', textTransform: 'uppercase' }}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
            </div>
            <button
              className="btn-candy w-full"
              style={{ background: 'linear-gradient(135deg,#9C27B0,#03A9F4)' }}
              onClick={handleJoin}
            >
              Rejoindre
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 px-3 py-2 rounded-xl text-sm text-center"
            style={{ background: 'rgba(244,67,54,0.2)', border: '1px solid rgba(244,67,54,0.5)', color: '#FF8A80' }}
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className="mt-4 text-sm"
        style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-game)' }}
        onClick={() => { playButtonClick(); onBack(); }}
      >
        ← Retour
      </button>
    </LobbyCard>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LobbyCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3 p-6 rounded-2xl"
      style={{
        background: 'rgba(0,0,0,0.40)',
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(255,215,0,0.3)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        minWidth: 310,
        fontFamily: 'var(--font-game)',
      }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

function Spinner({ color = '#FFD700' }: { color?: string }) {
  return (
    <motion.div
      className="w-8 h-8 rounded-full border-4 border-t-transparent"
      style={{ borderColor: `${color}40`, borderTopColor: 'transparent' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
    />
  );
}
