import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import logo from '/SugarSwap_Logo.png';

const LOGO_DEPTH: CSSProperties = { };

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const fixed = { sm: 80, md: 140, lg: 220 } as const;
  const isXl = size === 'xl';

  if (isXl) {
    return (
      <motion.div
        className="select-none flex justify-center w-full"
        style={{ lineHeight: 0 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={logo}
          alt="Sugar Swap"
          decoding="async"
          draggable={false}
          style={{
            display: 'block',
            width: 'auto',
            height: 'auto',
            maxWidth: 'min(420px, 92vw)',
            maxHeight: 'clamp(50px, 11vh, 120px)',
            objectFit: 'contain',
            ...LOGO_DEPTH,
          }}
        />
      </motion.div>
    );
  }

  const px = fixed[size];

  return (
    <motion.div
      className="flex items-center justify-center select-none"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img
        src={logo}
        alt="Sugar Swap"
        width={px}
        height={px}
        decoding="async"
        style={{
          display: 'block',
          width: px,
          height: px,
          objectFit: 'contain',
          ...LOGO_DEPTH,
        }}
        draggable={false}
      />
    </motion.div>
  );
}
