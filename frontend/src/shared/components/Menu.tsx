import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

interface MenuProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
  zIndex?: number;
  style?: CSSProperties;
}

export default function Menu({
  isOpen,
  onClose,
  children,
  title,
  zIndex = 50,
  style,
}: MenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            style={{ position: 'fixed', inset: 0, zIndex, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              zIndex: zIndex + 1,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(160deg, #1a0533 0%, #2d0a5c 50%, #1a1a2e 100%)',
              border: '2px solid rgba(255,215,0,0.5)',
              borderRadius: 24,
              padding: '24px 20px',
              minWidth: 260,
              maxWidth: 'min(calc(100vw - 32px), 360px)',
              fontFamily: 'var(--font-game)',
              boxShadow: '0 0 50px rgba(255,215,0,0.12), 0 20px 60px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              ...style,
            }}
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {title && (
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFD700', textAlign: 'center', textShadow: '0 0 12px rgba(255,215,0,0.4)', marginBottom: 4 }}>
                {title}
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
