import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

interface LinkProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  style?: CSSProperties;
  className?: string;
  external?: boolean;
}

export default function Link({ children, onClick, href, style, className = '', external = false }: LinkProps) {
  const base: CSSProperties = {
    fontFamily: 'var(--font-game)',
    color: '#03A9F4',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(3,169,244,0.4)',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.875rem',
    background: 'none',
    border: 'none',
    padding: 0,
    ...style,
  };

  if (href) {
    return (
      <motion.a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={base}
        className={className}
        whileHover={{ color: '#29B6F6' }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      style={base}
      className={className}
      onClick={onClick}
      whileHover={{ color: '#29B6F6' }}
    >
      {children}
    </motion.button>
  );
}
