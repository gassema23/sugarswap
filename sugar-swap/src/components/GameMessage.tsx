import { motion, AnimatePresence } from 'framer-motion';

export default function GameMessage({ message }: { message: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        className="px-5 py-2 rounded-full text-white text-sm font-bold text-center max-w-xs"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          fontFamily: 'var(--font-game)',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}
        initial={{ opacity: 0, y: -12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}
