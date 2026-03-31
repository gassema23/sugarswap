import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'candy' | 'ghost' | 'danger' | 'success' | 'outline';
export type ButtonSize    = 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  candy:   { background: 'linear-gradient(135deg, #E91E63 0%, #FF9800 100%)' },
  ghost:   { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' },
  danger:  { background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)' },
  success: { background: 'linear-gradient(135deg, #4CAF50 0%, #00BCD4 100%)' },
  outline: { background: 'transparent', border: '2px solid rgba(255,215,0,0.6)', color: '#FFD700' },
};

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { fontSize: '0.8rem',  padding: '0.4rem 1rem',  borderRadius: '999px' },
  md: { fontSize: '0.95rem', padding: '0.55rem 1.4rem', borderRadius: '999px' },
  lg: { fontSize: '1.05rem', padding: '0.7rem 1.8rem',  borderRadius: '999px' },
};

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  variant = 'candy',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  style,
  type = 'button',
}: ButtonProps) {
  const base: CSSProperties = {
    fontFamily: 'var(--font-game)',
    fontWeight: 700,
    color: 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 'none',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    boxShadow: variant === 'ghost' || variant === 'outline' ? 'none' : '0 4px 14px rgba(0,0,0,0.35)',
    letterSpacing: '0.02em',
    transition: 'box-shadow 0.15s',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    ...SIZE_STYLES[size],
    ...VARIANT_STYLES[variant],
    ...style,
  };

  return (
    <motion.button
      type={type}
      style={base}
      className={className}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.03, boxShadow: '0 6px 20px rgba(0,0,0,0.45)' }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}
