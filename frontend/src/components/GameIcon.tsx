import type { CSSProperties } from 'react';

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

/** PNG découpés depuis `public/icon.png` — plus fiable que le sprite CSS (ratios, WebKit). */
const ICON_SRC: Record<SpriteIconId, string> = {
  play: '/icons/play.png',
  settings: '/icons/settings.png',
  close: '/icons/close.png',
  robot: '/icons/robot.png',
  bookPink: '/icons/bookPink.png',
  bookPurple: '/icons/bookPurple.png',
  fruit: '/icons/fruit.png',
  hammer: '/icons/hammer.png',
  key: '/icons/key.png',
};

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

export default function GameIcon({ name, size = 28, className, style }: GameIconProps) {
  return (
    <img
      src={ICON_SRC[name]}
      alt=""
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        objectFit: 'contain',
        width: size,
        height: size,
        ...style,
      }}
    />
  );
}
