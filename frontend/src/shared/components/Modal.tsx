import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  maxWidth?: number | string;
  zIndex?: number;
  style?: CSSProperties;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 420,
  zIndex = 60,
  style,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content container */}
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: zIndex + 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              style={{
                width: typeof maxWidth === 'number' ? `min(100%, ${maxWidth}px)` : `min(100%, ${maxWidth})`,
                borderRadius: 28,
                overflow: 'hidden',
                fontFamily: 'var(--font-game)',
                ...style,
              }}
              initial={{ opacity: 0, scale: 0.75, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
