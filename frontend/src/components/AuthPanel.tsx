/**
 * AuthPanel — shown inside the online lobby before create/join.
 * Lets the user sign in with Google or Facebook to save their stats,
 * or continue as a guest (stats won't be saved).
 */

import { motion } from 'framer-motion';
import type { AuthUser } from '@/features/auth';

// Shared style for social login buttons — dark glass, matches candy theme
const socialBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  borderRadius: 999,
  border: '1.5px solid rgba(255,255,255,0.18)',
  cursor: 'pointer',
  padding: '9px 16px',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'white',
  fontFamily: 'var(--font-game)',
  background: 'rgba(255,255,255,0.09)',
  backdropFilter: 'blur(8px)',
  letterSpacing: '0.01em',
  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
};

interface Props {
  user:              AuthUser | null;
  loading:           boolean;
  onLoginGoogle:     () => void;
  onLoginFacebook:   () => void;
  onLogout:          () => void;
}

// Level XP thresholds (must mirror backend progression.service.ts)
function xpToNext(level: number) { return level * 500; }

// Badge display names
const BADGE_LABELS: Record<string, string> = {
  FIRST_WIN:        '🏅 1ère victoire',
  VETERAN:          '⚔️ Vétéran',
  GRAND_MASTER:     '👑 Grand Maître',
  SHARP_MIND:       '🧠 Esprit vif',
  PERFECTIONIST:    '💎 Perfectionniste',
  LEVEL_5:          '⭐ Niveau 5',
  LEVEL_10:         '🌟 Niveau 10',
  LEVEL_15:         '✨ Niveau 15',
  SOCIAL_BUTTERFLY: '🌐 Social',
};

export default function AuthPanel({ user, loading, onLoginGoogle, onLoginFacebook, onLogout }: Props) {
  if (loading) return null;

  // ── Logged-in view ────────────────────────────────────────────────────────
  if (user) {
    const xpNeeded = xpToNext(user.level);
    const xpPct    = Math.min(100, Math.round((user.experience % xpNeeded) / xpNeeded * 100));

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col gap-2"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(120,60,200,0.10) 100%)',
          border: '1.5px solid rgba(255,215,0,0.35)',
          borderRadius: 16,
          padding: '12px 14px',
        }}
      >
        {/* Avatar + name + level */}
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid rgba(255,215,0,0.5)', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #E91E63, #7B1FA2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 900, color: '#fff',
              border: '2px solid rgba(255,215,0,0.5)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span style={{ color: '#FFD700', fontFamily: 'var(--font-game)', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
              {user.totalMatches} partie{user.totalMatches !== 1 ? 's' : ''} • {user.totalPoints} pépites
            </span>
          </div>
          {/* Level badge */}
          <div style={{
            background: 'linear-gradient(135deg, #FF6B35, #FFD700)',
            borderRadius: 8, padding: '3px 10px',
            fontFamily: 'var(--font-game)', fontSize: '0.78rem', fontWeight: 900,
            color: '#1a1a1a', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Niv. {user.level}
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>XP</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
              {user.experience % xpNeeded} / {xpNeeded}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #FFD700, #FF6B35)' }}
            />
          </div>
        </div>

        {/* Badges (first 4) */}
        {user.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.badges.slice(0, 4).map((b) => (
              <span
                key={b.id}
                style={{
                  background: 'rgba(255,215,0,0.12)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 999, padding: '1px 8px',
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)',
                }}
              >
                {BADGE_LABELS[b.type] ?? b.type}
              </span>
            ))}
            {user.badges.length > 4 && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', alignSelf: 'center' }}>
                +{user.badges.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem',
            fontFamily: 'var(--font-game)', textAlign: 'right', padding: 0,
          }}
        >
          Se déconnecter
        </button>
      </motion.div>
    );
  }

  // ── Guest view — login buttons ────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-2"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1.5px dashed rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: '12px 14px',
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', textAlign: 'center', margin: 0 }}>
        Connecte-toi pour garder tes pépites &amp; débloquer des friandises
      </p>

      {/* Google */}
      <motion.button
        onClick={onLoginGoogle}
        style={socialBtnStyle}
        whileHover={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.32)', scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.6 0 6.6 5.5 2.6 13.5l7.9 6.1C12.5 13.4 17.8 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.8-9.9 7.2-16.9z"/>
          <path fill="#FBBC05" d="M10.5 28.4c-.6-1.6-.9-3.3-.9-5.1s.3-3.5.9-5.1L2.6 12.1C.9 15.4 0 19.1 0 23.3s.9 8 2.6 11.1l7.9-6z"/>
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.2 0-11.5-4-13.5-9.5l-7.9 6.1C6.6 42.5 14.6 48 24 48z"/>
        </svg>
        Continuer avec Google
      </motion.button>

      {/* Facebook */}
      <motion.button
        onClick={onLoginFacebook}
        style={{ ...socialBtnStyle, borderColor: 'rgba(24,119,242,0.45)' }}
        whileHover={{ background: 'rgba(24,119,242,0.18)', borderColor: 'rgba(24,119,242,0.7)', scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
        Continuer avec Facebook
      </motion.button>

      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem' }}>
        — ou —
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textAlign: 'center', margin: 0 }}>
        Continue en invité (sans sauvegarde des pépites)
      </p>
    </motion.div>
  );
}
