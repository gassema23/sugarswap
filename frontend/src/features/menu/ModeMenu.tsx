import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import AuthPanel from '@/components/AuthPanel';
import { playButtonClick } from '@/utils/sounds';
import type { AuthUser } from '@/hooks/useAuth';
import { AI_NAME } from '@/constants';

type MenuMode = 'vs_ai' | 'vs_human';

interface ModeMenuProps {
  onSelect:         (m: MenuMode) => void;
  onRules:          () => void;
  onLeaderboard:    () => void;
  user:             AuthUser | null;
  authLoading:      boolean;
  onLoginGoogle:    () => void;
  onLoginFacebook:  () => void;
  onLogout:         () => void;
}

export default function ModeMenu({
  onSelect, onRules, onLeaderboard,
  user, authLoading, onLoginGoogle, onLoginFacebook, onLogout,
}: ModeMenuProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <Logo size="lg" />
      <div
        className="flex flex-col gap-3 items-center rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(180,50,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,100,50,0.06) 0%, transparent 60%), linear-gradient(165deg, rgba(28,8,68,0.97) 0%, rgba(10,4,30,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          border: '2px solid rgba(255,205,0,0.65)',
          boxShadow: '0 0 0 1px rgba(160,90,0,0.38), 0 0 55px rgba(160,60,255,0.12), 0 26px 70px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,220,100,0.32), inset 0 -1px 0 rgba(0,0,0,0.45)',
          width: 'min(calc(100vw - 32px), 450px)',
          padding: '24px 22px',
        }}
      >
        {/* Auth panel */}
        <AuthPanel
          user={user}
          loading={authLoading}
          onLoginGoogle={onLoginGoogle}
          onLoginFacebook={onLoginFacebook}
          onLogout={onLogout}
        />

        <h2 style={{
          fontFamily: 'var(--font-game)',
          margin: 0,
          fontSize: '1.2rem',
          letterSpacing: '0.03em',
          background: 'linear-gradient(135deg, #FFE866 0%, #FFD700 45%, #FFAA00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 1px 8px rgba(255,170,0,0.55))',
          textAlign: 'center',
        }}>
          Prêt pour une dose de sucre ?
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
          Solo vs {AI_NAME} 🍭
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
          Île en ligne (2–8 joueurs) 🏝️
        </button>

        <div className="w-full flex gap-2">
          <button
            className="btn-candy flex-1"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 48%), linear-gradient(135deg, #00ACC1 0%, #1976D2 100%)',
              fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onClick={() => { playButtonClick(); onRules(); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6C4 4.9 4.9 4 6 4H19V20H6C4.9 20 4 19.1 4 18V6Z" stroke="white" strokeWidth="1.8" fill="rgba(255,255,255,0.15)"/>
              <path d="M4 18C4 16.9 4.9 16 6 16H19" stroke="white" strokeWidth="1.8"/>
              <line x1="8" y1="9" x2="15" y2="9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="12.5" x2="13" y2="12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Règles 📖
          </button>

          <button
            className="btn-candy flex-1"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 48%), linear-gradient(135deg, #F9A825 0%, #E65100 100%)',
              fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onClick={() => { playButtonClick(); onLeaderboard(); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.6"/>
              <rect x="10" y="7" width="4" height="14" rx="1" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.6"/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.6"/>
            </svg>
            Classement 🏆
          </button>
        </div>
      </div>
    </motion.div>
  );
}
