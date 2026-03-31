import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OnlineStatus } from '@/features/online';
import type { AuthUser } from '@/features/auth';
import { playButtonClick } from '@/shared/utils/sounds';
import GameIcon from './GameIcon';
import Logo from './Logo';

interface Props {
  status:          OnlineStatus;
  roomCode:        string | null;
  players:         string[];
  maxPlayers:      number;
  playerIndex:     number | null;
  errorMsg:        string | null;
  authUser:        AuthUser | null;
  authLoading:     boolean;
  onLoginGoogle:   () => void;
  onLoginFacebook: () => void;
  onLogout:        () => void;
  onCreateRoom:    (name: string, maxPlayers: number) => void;
  onJoinRoom:      (code: string, name: string) => void;
  onStartGame:     () => void;
  onBack:          () => void;
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-game)',
  background: 'rgba(255,255,255,0.10)',
  border: '2px solid rgba(255,215,0,0.4)',
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
  authUser,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onBack,
}: Props) {
  const [name, setName]           = useState(authUser?.name ?? '');
  const [code, setCode]           = useState('');
  const [tab, setTab]             = useState<'create' | 'join'>('create');
  const [selectedMax, setSelectedMax] = useState(2);

  const isHost   = playerIndex === 0;
  const canStart = isHost && players.length >= 2;
  const displayName = authUser?.name ?? name;

  function handleCreate() {
    if (!displayName.trim()) return;
    playButtonClick();
    onCreateRoom(displayName.trim(), selectedMax);
  }

  function handleJoin() {
    if (!displayName.trim() || !code.trim()) return;
    playButtonClick();
    onJoinRoom(code.trim(), displayName.trim());
  }

  // ── Waiting for players ──────────────────────────────────────────────────
  if (status === 'waiting') {
    return (
      <LobbyWrapper>
        <div className="flex justify-center mb-1"><GameIcon name="key" size={40} /></div>
        <h3 style={{ color: '#FFD700', margin: 0, fontSize: '1.2rem', textAlign: 'center' }}>
          {isHost ? 'En attente de gourmands… 🍬' : 'Le sucre chauffe… 🏝️'}
        </h3>

        {isHost && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', margin: '4px 0 8px', textAlign: 'center' }}>
              Glisse ce code à tes complices :
            </p>
            <motion.div
              className="px-5 py-2 rounded-2xl text-3xl font-bold tracking-widest select-all cursor-pointer"
              style={{
                background: 'rgba(255,215,0,0.12)',
                border: '2px solid rgba(255,215,0,0.55)',
                color: '#FFD700',
                letterSpacing: '0.25em',
                textShadow: '0 0 18px rgba(255,215,0,0.5)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigator.clipboard?.writeText(roomCode ?? '')}
              title="Cliquer pour copier"
            >
              {roomCode}
            </motion.div>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.68rem', marginTop: 2 }}>Cliquer pour copier</p>
          </>
        )}

        <div className="w-full mt-1">
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: 6, textAlign: 'center' }}>
            Joueurs connectés ({players.length}/{maxPlayers})
          </p>
          <div className="flex flex-col gap-1.5">
            {players.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{
                  background: i === playerIndex
                    ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,152,0,0.08))'
                    : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i === playerIndex ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <span style={{ display: 'inline-flex' }}>
                  {i === 0 ? <GameIcon name="play" size={18} /> : <GameIcon name="bookPink" size={18} />}
                </span>
                <span style={{ color: i === playerIndex ? '#FFD700' : 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: i === playerIndex ? 700 : 500 }}>
                  {p}{i === playerIndex ? ' (toi)' : ''}
                </span>
              </div>
            ))}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
              >
                <span style={{ opacity: 0.3, display: 'inline-flex' }}><GameIcon name="settings" size={18} /></span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', fontStyle: 'italic' }}>En attente…</span>
              </div>
            ))}
          </div>
        </div>

        {canStart && players.length < maxPlayers && (
          <motion.button
            className="btn-candy w-full mt-2"
            style={{ background: 'linear-gradient(135deg,#4CAF50,#03A9F4)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() => { playButtonClick(); onStartGame(); }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <GameIcon name="play" size={22} />
            Lancer la fête ({players.length} gourmands)
          </motion.button>
        )}

        {!canStart && <Spinner />}

        <BackButton onClick={() => { playButtonClick(); onBack(); }} />
      </LobbyWrapper>
    );
  }

  // ── All players joined → host starting ───────────────────────────────────
  if (status === 'ready') {
    return (
      <LobbyWrapper>
        <div className="flex justify-center mb-1"><GameIcon name="fruit" size={44} /></div>
        <h3 style={{ color: '#4CAF50', margin: 0, fontSize: '1.1rem', textAlign: 'center', textShadow: '0 0 14px rgba(76,175,80,0.5)' }}>
          Tout le monde est sucré à point !
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginTop: 4 }}>La fête démarre… ✨</p>
        <Spinner color="#4CAF50" />
      </LobbyWrapper>
    );
  }

  // ── Connecting ────────────────────────────────────────────────────────────
  if (status === 'connecting') {
    return (
      <LobbyWrapper>
        <Spinner />
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>On file vers l&apos;île… 🏝️</p>
      </LobbyWrapper>
    );
  }

  // ── Disconnected ──────────────────────────────────────────────────────────
  if (status === 'player_disconnected' || status === 'opponent_disconnected') {
    return (
      <LobbyWrapper>
        <div className="flex justify-center mb-1"><GameIcon name="close" size={44} /></div>
        <h3 style={{ color: '#FF5722', margin: 0, textAlign: 'center', fontSize: '1.1rem' }}>
          Un gourmand a quitté l&apos;île…
        </h3>
        <motion.button
          className="btn-candy mt-4"
          style={{ background: 'linear-gradient(135deg,#E91E63,#FF9800)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={onBack}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <GameIcon name="play" size={20} />
          Retour au port 🍭
        </motion.button>
      </LobbyWrapper>
    );
  }

  // ── Default: Create / Join form ───────────────────────────────────────────
  return (
    <LobbyWrapper>
      <h3 style={{
        color: '#FFD700',
        margin: '0 0 2px',
        fontSize: '1.3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        textShadow: '0 0 16px rgba(255,215,0,0.45)',
      }}>
        <GameIcon name="key" size={28} />
        Île en ligne
      </h3>

      {/* Tab selector */}
      <div className="flex gap-2 w-full">
        {(['create', 'join'] as const).map(t => (
          <motion.button
            key={t}
            className="btn-candy"
            style={{
              flex: 1,
              background: tab === t
                ? 'linear-gradient(135deg, #E91E63, #FF9800)'
                : 'rgba(255,255,255,0.08)',
              border: tab === t
                ? '2px solid rgba(255,215,0,0.7)'
                : '2px solid rgba(255,255,255,0.12)',
              fontSize: '0.85rem',
              padding: '0.4rem 0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onClick={() => { setTab(t); playButtonClick(); }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <GameIcon name={t === 'create' ? 'fruit' : 'key'} size={18} />
            {t === 'create' ? 'Créer' : 'Rejoindre'}
          </motion.button>
        ))}
      </div>

      {/* Name input — hidden when logged in */}
      {!authUser && (
        <div className="flex flex-col gap-1 w-full">
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Ton prénom</label>
          <input
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Alice"
            maxLength={20}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col items-center gap-3 w-full"
          >
            <div className="flex flex-col gap-1 w-full">
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                Nombre de joueurs (2–8)
              </label>
              <select
                value={selectedMax}
                onChange={e => { setSelectedMax(Number(e.target.value)); playButtonClick(); }}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n} style={{ background: '#1a1a2e', color: 'white' }}>
                    {n} joueurs
                  </option>
                ))}
              </select>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
              Un code magique apparaît — partage-le à tes complices !
            </p>
            <motion.button
              className="btn-candy w-full"
              style={{ background: 'linear-gradient(135deg,#4CAF50,#03A9F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleCreate}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <GameIcon name="play" size={20} />
              Créer la partie
            </motion.button>
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
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Code de la partie</label>
              <input
                style={{ ...inputStyle, letterSpacing: '0.2em', textTransform: 'uppercase' }}
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
            </div>
            <motion.button
              className="btn-candy w-full"
              style={{ background: 'linear-gradient(135deg,#7B1FA2,#03A9F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleJoin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <GameIcon name="key" size={20} />
              Rejoindre
            </motion.button>
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
            className="w-full px-3 py-2 rounded-xl text-sm text-center"
            style={{ background: 'rgba(244,67,54,0.15)', border: '1px solid rgba(244,67,54,0.4)', color: '#FF8A80' }}
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <BackButton onClick={() => { playButtonClick(); onBack(); }} />
    </LobbyWrapper>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Wrapper with Logo + dark candy-menu card — matches the main menu style. */
function LobbyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <Logo size="md" />

      <div
        className="flex flex-col items-center gap-3 rounded-3xl"
        style={{
          background: [
            'radial-gradient(ellipse at 20% 20%, rgba(180,50,255,0.08) 0%, transparent 60%)',
            'radial-gradient(ellipse at 80% 80%, rgba(255,100,50,0.06) 0%, transparent 60%)',
            'linear-gradient(165deg, rgba(28,8,68,0.97) 0%, rgba(10,4,30,0.99) 100%)',
          ].join(', '),
          backdropFilter: 'blur(24px)',
          border: '2px solid rgba(255,205,0,0.65)',
          boxShadow: [
            '0 0 0 1px rgba(160,90,0,0.38)',
            '0 0 55px rgba(160,60,255,0.12)',
            '0 26px 70px rgba(0,0,0,0.72)',
            'inset 0 1px 0 rgba(255,220,100,0.32)',
            'inset 0 -1px 0 rgba(0,0,0,0.45)',
          ].join(', '),
          width: 'min(calc(100vw - 32px), 450px)',
          maxHeight: '82dvh',
          overflowY: 'auto',
          padding: '24px 20px',
          fontFamily: 'var(--font-game)',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
        fontFamily: 'var(--font-game)', marginTop: 4,
      }}
      onClick={onClick}
      whileHover={{ color: 'rgba(255,255,255,0.65)' }}
    >
      ← Retour
    </motion.button>
  );
}

function Spinner({ color = '#FFD700' }: { color?: string }) {
  return (
    <motion.div
      className="w-8 h-8 rounded-full border-4"
      style={{ borderColor: `${color}30`, borderTopColor: color }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
    />
  );
}
