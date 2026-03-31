import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth';
import Background from './components/Background';
import RulesModal from './components/RulesModal';
import LeaderboardModal from './components/LeaderboardModal';
import type { AiDifficulty } from '@/features/game';
import { VsAiSetup, VsAiGame } from '@/features/game';
import { VsHumanGame } from '@/features/online';
import { ModeMenu } from '@/features/menu';

type AppMode = 'menu' | 'vs_ai_setup' | 'vs_ai' | 'vs_human';

export default function App() {
  const [mode, setMode]             = useState<AppMode>('menu');
  const [names, setNames]           = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium');
  const [showRules, setShowRules]   = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user: authUser, token, loading: authLoading, loginWithGoogle, loginWithFacebook, logout } = useAuth();

  function handleVsAiStart(n: string[], d: AiDifficulty) {
    setNames(n);
    setDifficulty(d);
    setMode('vs_ai');
  }

  return (
    <div className="flex flex-col items-center relative" style={{ fontFamily: 'var(--font-game)', overflow: 'hidden', height: '100dvh' }}>
      <Background />

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserId={authUser?.id ?? null}
      />

      <AnimatePresence mode="wait">
        {mode === 'menu' && (
          <motion.div key="menu" className="flex-1 flex items-center justify-center overflow-y-auto py-4" exit={{ opacity: 0, scale: 0.9 }}>
            <ModeMenu
              onSelect={m => {
                if (m === 'vs_ai') setMode('vs_ai_setup');
                else setMode('vs_human');
              }}
              onRules={() => setShowRules(true)}
              onLeaderboard={() => setShowLeaderboard(true)}
              user={authUser}
              authLoading={authLoading}
              onLoginGoogle={loginWithGoogle}
              onLoginFacebook={loginWithFacebook}
              onLogout={logout}
            />
          </motion.div>
        )}

        {(mode as string) === 'vs_ai_setup' && (
          <motion.div key="setup" className="flex-1 flex items-center justify-center" exit={{ opacity: 0, scale: 0.9 }}>
            <VsAiSetup
              onStart={handleVsAiStart}
              onBack={() => setMode('menu')}
            />
          </motion.div>
        )}

        {mode === 'vs_ai' && names.length > 0 && (
          <motion.div key="vsai" className="flex-1 flex min-h-0 w-full" exit={{ opacity: 0 }}>
            <VsAiGame
              names={names}
              difficulty={difficulty}
              onBackToMenu={() => setMode('menu')}
              token={token}
              authUserId={authUser?.id ?? null}
            />
          </motion.div>
        )}

        {mode === 'vs_human' && (
          <motion.div key="vshuman" className="flex-1 flex min-h-0 w-full" exit={{ opacity: 0 }}>
            <VsHumanGame
              onBackToMenu={() => setMode('menu')}
              token={token}
              authUser={authUser}
              authLoading={authLoading}
              onLoginGoogle={loginWithGoogle}
              onLoginFacebook={loginWithFacebook}
              onLogout={logout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
