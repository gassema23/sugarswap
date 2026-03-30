import { motion } from 'framer-motion';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const imgSize = { sm: 80, md: 140, lg: 220 }[size];

  return (
    <motion.div
      className="flex items-center justify-center select-none"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img
        src="/logo.jpg"
        alt="Sugar Swap"
        width={imgSize}
        height={imgSize}
        style={{
          filter: 'drop-shadow(0 4px 16px rgba(233,30,99,0.5)) drop-shadow(0 0 8px rgba(255,215,0,0.7))',
          borderRadius: '16px',
        }}
        draggable={false}
      />
    </motion.div>
  );
}
