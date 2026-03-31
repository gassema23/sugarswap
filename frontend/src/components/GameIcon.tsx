import { type CSSProperties, type ReactElement } from 'react';

export type SpriteIconId =
  | 'play'
  | 'settings'
  | 'close'
  | 'robot'
  | 'bookPink'
  | 'bookPurple'
  | 'fruit'
  | 'hammer'
  | 'key';

interface GameIconProps {
  name: SpriteIconId;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function rankSprite(rank: number): SpriteIconId | null {
  if (rank === 0) return 'play';
  if (rank === 1) return 'settings';
  if (rank === 2) return 'close';
  return null;
}

// ── Candy SVG icons ───────────────────────────────────────────────────────────

function IconPlay({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ic-play-ball" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#FF9EDF"/>
          <stop offset="60%" stopColor="#E91E8C"/>
          <stop offset="100%" stopColor="#9C1060"/>
        </radialGradient>
      </defs>
      {/* Stick */}
      <rect x="14.5" y="19" width="3" height="10" rx="1.5" fill="#C8845A"/>
      {/* Ball */}
      <circle cx="16" cy="13" r="9" fill="url(#ic-play-ball)"/>
      {/* Swirl highlight */}
      <path d="M11 9 Q16 5 21 9 Q18 14 13 15 Q10 12 11 9Z" fill="rgba(255,255,255,0.28)" stroke="none"/>
      <path d="M12 15 Q14 18 18 17" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      {/* Shine */}
      <circle cx="12.5" cy="9.5" r="2" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );
}

function IconSettings({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-set-wrap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF9B3C"/>
          <stop offset="100%" stopColor="#C96A10"/>
        </linearGradient>
        <linearGradient id="ic-set-cream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFACD"/>
          <stop offset="100%" stopColor="#F5D78E"/>
        </linearGradient>
      </defs>
      {/* Wrapper */}
      <path d="M8 20 Q8 28 16 28 Q24 28 24 20 L22 16 H10 Z" fill="url(#ic-set-wrap)"/>
      {/* Wrapper ridges */}
      <line x1="12" y1="17" x2="11" y2="27" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
      <line x1="16" y1="16" x2="16" y2="28" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
      <line x1="20" y1="17" x2="21" y2="27" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
      {/* Cream mound */}
      <path d="M9 17 Q10 10 16 9 Q22 10 23 17 Q20 14 16 15 Q12 14 9 17Z" fill="url(#ic-set-cream)"/>
      {/* Cherry */}
      <circle cx="16" cy="7" r="3.5" fill="#E91E1E"/>
      <circle cx="15" cy="5.5" r="1" fill="rgba(255,255,255,0.5)"/>
      {/* Cherry stem */}
      <path d="M16 3.5 Q18 2 19 3" stroke="#3A7A20" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function IconClose({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ic-close-bg" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FF7A4A"/>
          <stop offset="100%" stopColor="#D93800"/>
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="url(#ic-close-bg)"/>
      <circle cx="14" cy="12" r="2.5" fill="rgba(255,255,255,0.25)"/>
      <line x1="10.5" y1="10.5" x2="21.5" y2="21.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="21.5" y1="10.5" x2="10.5" y2="21.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconRobot({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-robot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5CE8D4"/>
          <stop offset="100%" stopColor="#0EA5B0"/>
        </linearGradient>
      </defs>
      {/* Antenna */}
      <rect x="15" y="2" width="2" height="4" rx="1" fill="#0EA5B0"/>
      <circle cx="16" cy="2" r="2" fill="#FF6BB5"/>
      {/* Head */}
      <rect x="6" y="6" width="20" height="16" rx="5" fill="url(#ic-robot-body)"/>
      {/* Eyes */}
      <circle cx="11.5" cy="13" r="3.5" fill="#1A2A4A"/>
      <circle cx="20.5" cy="13" r="3.5" fill="#1A2A4A"/>
      <circle cx="12" cy="12.5" r="1.5" fill="#FF6BB5"/>
      <circle cx="21" cy="12.5" r="1.5" fill="#FF6BB5"/>
      <circle cx="12.5" cy="12" r="0.6" fill="white"/>
      <circle cx="21.5" cy="12" r="0.6" fill="white"/>
      {/* Mouth */}
      <rect x="10" y="18" width="12" height="2.5" rx="1.25" fill="#1A2A4A"/>
      <rect x="12" y="18" width="2" height="2.5" fill="#5CE8D4"/>
      <rect x="15" y="18" width="2" height="2.5" fill="#5CE8D4"/>
      <rect x="18" y="18" width="2" height="2.5" fill="#5CE8D4"/>
      {/* Ears */}
      <rect x="2" y="11" width="4" height="6" rx="2" fill="#0EA5B0"/>
      <rect x="26" y="11" width="4" height="6" rx="2" fill="#0EA5B0"/>
      {/* Body */}
      <rect x="9" y="23" width="14" height="6" rx="3" fill="url(#ic-robot-body)"/>
    </svg>
  );
}

function IconBookPink({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ic-bpink-body" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFAEE0"/>
          <stop offset="100%" stopColor="#D63FA0"/>
        </radialGradient>
      </defs>
      {/* Body */}
      <circle cx="16" cy="19" r="9" fill="url(#ic-bpink-body)"/>
      {/* Head */}
      <circle cx="16" cy="9" r="6" fill="url(#ic-bpink-body)"/>
      {/* Shine */}
      <circle cx="13.5" cy="7" r="1.8" fill="rgba(255,255,255,0.4)"/>
      {/* Candy bow */}
      <path d="M10 5 Q12 3 14 5 Q12 7 10 5Z" fill="#FF1493"/>
      <path d="M18 5 Q20 3 22 5 Q20 7 18 5Z" fill="#FF1493"/>
      <circle cx="16" cy="5" r="2" fill="#FF6BB5"/>
    </svg>
  );
}

function IconBookPurple({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-bpurp-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#DDB7FF"/>
          <stop offset="45%" stopColor="#9B30F0"/>
          <stop offset="100%" stopColor="#5B0FA0"/>
        </linearGradient>
      </defs>
      {/* Gem shape */}
      <polygon points="16,3 25,10 22,27 10,27 7,10" fill="url(#ic-bpurp-gem)"/>
      {/* Top crown */}
      <polygon points="16,3 20,8 16,7 12,8" fill="#EBC8FF"/>
      {/* Facets */}
      <line x1="16" y1="7" x2="10" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
      <line x1="16" y1="7" x2="22" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
      <line x1="9" y1="14" x2="23" y2="14" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
      {/* Shine */}
      <polygon points="13,8 16,7 15,13 11,12" fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}

function IconFruit({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ic-fruit-outer" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFEC6E"/>
          <stop offset="100%" stopColor="#FF9F00"/>
        </radialGradient>
        <radialGradient id="ic-fruit-inner" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF2A0"/>
          <stop offset="100%" stopColor="#FFD000"/>
        </radialGradient>
      </defs>
      {/* Star rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line
          key={i}
          x1="16" y1="16"
          x2={16 + Math.cos((deg - 90) * Math.PI / 180) * 14}
          y2={16 + Math.sin((deg - 90) * Math.PI / 180) * 14}
          stroke="url(#ic-fruit-outer)"
          strokeWidth={i % 2 === 0 ? 4 : 2.5}
          strokeLinecap="round"
        />
      ))}
      {/* Center disc */}
      <circle cx="16" cy="16" r="7" fill="url(#ic-fruit-outer)"/>
      <circle cx="16" cy="16" r="4.5" fill="url(#ic-fruit-inner)"/>
      {/* Shine */}
      <circle cx="14" cy="14" r="1.5" fill="rgba(255,255,255,0.55)"/>
    </svg>
  );
}

function IconHammer({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ic-hmr-head" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E040FB"/>
          <stop offset="50%" stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#E040FB"/>
        </linearGradient>
        <linearGradient id="ic-hmr-stripe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6BB5"/>
          <stop offset="100%" stopColor="#B83FC0"/>
        </linearGradient>
      </defs>
      {/* Handle — candy cane striped */}
      <rect x="18" y="14" width="5" height="16" rx="2.5" fill="#FFEAF5" transform="rotate(-40 18 14)"/>
      <rect x="19.5" y="14" width="2" height="16" rx="1" fill="#E040FB" transform="rotate(-40 18 14)" opacity="0.5"/>
      {/* Head */}
      <rect x="4" y="5" width="18" height="11" rx="4" fill="url(#ic-hmr-head)"/>
      {/* Stripes on head */}
      <rect x="4" y="5" width="6" height="11" rx="0" fill="#E040FB" opacity="0.35"/>
      <rect x="16" y="5" width="6" height="11" rx="0" fill="#E040FB" opacity="0.35" clipPath="url(#ic-hmr-clip)"/>
      {/* Shine */}
      <rect x="6" y="7" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

function IconKey({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ic-key-ring" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#FFE566"/>
          <stop offset="100%" stopColor="#C8960A"/>
        </radialGradient>
        <linearGradient id="ic-key-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD740"/>
          <stop offset="100%" stopColor="#B8860A"/>
        </linearGradient>
      </defs>
      {/* Ring */}
      <circle cx="12" cy="12" r="8" fill="url(#ic-key-ring)" stroke="#B8860A" strokeWidth="0.8"/>
      <circle cx="12" cy="12" r="4.5" fill="#1A1A2E"/>
      {/* Swirl inside ring */}
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="#FFD740" strokeWidth="1.2" strokeDasharray="3 2"/>
      {/* Shine on ring */}
      <circle cx="9.5" cy="8.5" r="2" fill="rgba(255,255,255,0.45)"/>
      {/* Shaft */}
      <rect x="18" y="11" width="12" height="4" rx="2" fill="url(#ic-key-shaft)"/>
      {/* Teeth */}
      <rect x="24" y="15" width="3" height="4" rx="1" fill="url(#ic-key-shaft)"/>
      <rect x="28" y="15" width="2.5" height="3" rx="1" fill="url(#ic-key-shaft)"/>
    </svg>
  );
}

// ── Icon registry ─────────────────────────────────────────────────────────────

const ICON_COMPONENTS: Record<SpriteIconId, (props: { size: number }) => ReactElement> = {
  play:       IconPlay,
  settings:   IconSettings,
  close:      IconClose,
  robot:      IconRobot,
  bookPink:   IconBookPink,
  bookPurple: IconBookPurple,
  fruit:      IconFruit,
  hammer:     IconHammer,
  key:        IconKey,
};

export default function GameIcon({ name, size = 28, className, style }: GameIconProps) {
  const IconComponent = ICON_COMPONENTS[name];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size,
        height: size,
        ...style,
      }}
    >
      <IconComponent size={size} />
    </span>
  );
}
