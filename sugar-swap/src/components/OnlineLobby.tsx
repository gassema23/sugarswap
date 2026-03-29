import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OnlineStatus } from '../hooks/useOnlineGame';
import { playButtonClick } from '../utils/sounds';

interface Props {
  status: OnlineStatus;
  roomCode: string | null;
  opponentName: string | null;
  errorMsg: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom:   (code: string, name: string) => void;
  onBack: () => void;
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
  opponentName,
  errorMsg,
  onCreateRoom,
  onJoinRoom,
  onBack,
}: Props) {
  const [name, setName]   = useState('');
  const [code, setCode]   = useState('');
  const [tab, setTab]     = useState<'create' | 'join'>('create');

  function handleCreate() {
    if (!name.trim()) return;
    playButtonClick();
    onCreateRoom(name.trim());
  }

  function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    playButtonClick();
    onJoinRoom(code.trim(), name.trim());
  }

  // ── Waiting for opponent ─────────────────────────────────────────────────
  if (status === 'waiting') {
    return (
      <LobbyCard>
        <div className="text-3xl mb-1">⏳</div>
        <h3 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem' }}>En attente d'un adversaire…</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '4px 0 12px' }}>
          Partage ce code à ton ami :
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
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: 6 }}>
          Cliquer pour copier
        </p>
        <Spinner />
      </LobbyCard>
    );
  }

  // ── Opponent joined → host starting game ─────────────────────────────────
  if (status === 'ready') {
    return (
      <LobbyCard>
        <div className="text-3xl mb-1">🎉</div>
        <h3 style={{ color: '#4CAF50', margin: 0, fontSize: '1.1rem' }}>
          {opponentName} a rejoint !
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 6 }}>
          La partie commence…
        </p>
        <Spinner color="#4CAF50" />
      </LobbyCard>
    );
  }

  // ── Joiner connecting ─────────────────────────────────────────────────────
  if (status === 'connecting') {
    return (
      <LobbyCard>
        <Spinner />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Connexion…</p>
      </LobbyCard>
    );
  }

  // ── Disconnected ──────────────────────────────────────────────────────────
  if (status === 'opponent_disconnected') {
    return (
      <LobbyCard>
        <div className="text-3xl mb-1">🔌</div>
        <h3 style={{ color: '#FF5722', margin: 0 }}>Adversaire déconnecté</h3>
        <button className="btn-candy mt-4" style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)' }} onClick={onBack}>
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
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textAlign: 'center', margin: 0 }}>
              Un code sera généré — partage-le à ton ami.
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
        minWidth: 300,
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
