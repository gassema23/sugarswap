import { motion } from 'framer-motion';

// ─── Confetti piece ───────────────────────────────────────────────────────────
interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
}

const CANDY_COLORS = [
  '#E91E63', '#03A9F4', '#FFEB3B', '#4CAF50',
  '#FF9800', '#9C27B0', '#FF5722', '#00BCD4',
];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
    size: 6 + Math.random() * 8,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 8,
    rotate: Math.random() * 360,
  }));
}


// ─── Palm tree SVG (blurry, decorative) ──────────────────────────────────────
function PalmTree({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <div
      className="absolute bottom-0 pointer-events-none select-none"
      style={{
        [side]: '-20px',
        opacity: 0.55,
        filter: 'blur(2px)',
        transform: flip ? 'scaleX(-1)' : undefined,
        zIndex: 0,
      }}
    >
      <svg width="180" height="320" viewBox="0 0 180 320" fill="none">
        {/* Trunk */}
        <path d="M90 320 Q85 240 88 180 Q92 120 90 60" stroke="#8D6E63" strokeWidth="14" strokeLinecap="round" fill="none"/>
        {/* Fronds */}
        <path d="M90 65 Q50 30 10 50 Q50 55 85 75" fill="#388E3C"/>
        <path d="M90 65 Q130 25 170 40 Q130 55 95 72" fill="#43A047"/>
        <path d="M90 65 Q40 55 20 80 Q55 70 88 80" fill="#2E7D32"/>
        <path d="M90 65 Q140 50 160 75 Q125 68 93 78" fill="#388E3C"/>
        <path d="M90 65 Q75 20 60 5 Q80 40 90 68" fill="#43A047"/>
        <path d="M90 65 Q105 18 120 8 Q100 42 90 68" fill="#2E7D32"/>
      </svg>
    </div>
  );
}

// ─── Main Background ─────────────────────────────────────────────────────────
const CONFETTI = generateConfetti(35);

export default function Background() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {/* Sky to sand gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #4DD0E1 0%, #80DEEA 25%, #B2EBF2 55%, #FFF9C4 75%, #FFE082 88%, #FFCC80 100%)',
        }}
      />

      {/* Warm sun glow at horizon */}
      <div
        className="absolute"
        style={{
          bottom: '28%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '200px',
          background: 'radial-gradient(ellipse at center, rgba(255,236,100,0.5) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Ocean shimmer line */}
      <div
        className="absolute w-full"
        style={{
          bottom: '30%',
          height: '3px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Sand waves */}
      <svg
        className="absolute w-full"
        style={{ bottom: 0, height: '32%' }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          d="M0,160 C360,200 720,100 1080,160 C1260,190 1380,200 1440,180 L1440,320 L0,320 Z"
          fill="#FFD54F"
          opacity="0.6"
        />
        <path
          d="M0,200 C300,160 700,240 1080,190 C1260,170 1380,220 1440,210 L1440,320 L0,320 Z"
          fill="#FFCA28"
          opacity="0.8"
        />
        <path
          d="M0,240 C400,210 900,270 1440,240 L1440,320 L0,320 Z"
          fill="#FFB300"
          opacity="0.9"
        />
      </svg>

      {/* Palm trees */}
      <PalmTree side="left" />
      <PalmTree side="right" />

      {/* Floating confetti */}
      {CONFETTI.map(c => (
        <motion.div
          key={c.id}
          className="absolute pointer-events-none"
          style={{
            left: `${c.x}%`,
            top: '-20px',
            width: c.size,
            height: c.size * 0.5,
            background: c.color,
            borderRadius: '2px',
            rotate: c.rotate,
            boxShadow: `0 0 4px ${c.color}`,
          }}
          animate={{
            y: ['0vh', '115vh'],
            rotate: [c.rotate, c.rotate + 720],
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Sparkle stars (static) */}
      {[
        { x: 15, y: 12 }, { x: 35, y: 8 }, { x: 55, y: 15 },
        { x: 72, y: 6 },  { x: 85, y: 18 }, { x: 25, y: 22 },
        { x: 65, y: 10 }, { x: 90, y: 12 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          animate={{ scale: [0.5, 1.4, 0.5], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z" fill="white" opacity="0.85"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
