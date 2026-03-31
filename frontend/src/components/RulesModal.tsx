import { motion, AnimatePresence } from 'framer-motion';
import { cardColor, cardTextColor } from '@/features/game';
import type { CardValue } from '@/features/game';
import GameIcon, { type SpriteIconId } from './GameIcon';

// ─── Mini candy card (illustrative) ──────────────────────────────────────────
function MiniCard({
  value,
  size = 44,
  hidden = false,
}: {
  value: CardValue;
  size?: number;
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <div
        style={{
          width: size,
          height: Math.round(size * 1.35),
          borderRadius: 8,
          border: '2px solid #FFD700',
          boxShadow: '0 0 0 1px #C9A227, inset 0 2px 4px rgba(255,255,255,0.35)',
          background: 'repeating-linear-gradient(45deg,#1565C0 0px,#1565C0 6px,#fff 6px,#fff 12px)',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: Math.round(size * 1.35),
        borderRadius: 8,
        border: '2px solid #FFD700',
        boxShadow: '0 0 0 1px #C9A227, inset 0 2px 6px rgba(255,255,255,0.5), 0 3px 8px rgba(0,0,0,0.2)',
        background: cardColor(value),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-game)',
        fontSize: size < 40 ? '0.9rem' : '1.2rem',
        fontWeight: 900,
        color: cardTextColor(value),
        textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: 6,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.45) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      {value}
    </div>
  );
}

// ─── Column combo diagram ─────────────────────────────────────────────────────
function ColumnCombo() {
  return (
    <div className="flex gap-4 items-start justify-center flex-wrap">
      {/* Before: 3 identical cards in a column */}
      <div className="flex flex-col items-center gap-1">
        <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-game)' }}>Avant 🍬</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 36px)', gap: 4 }}>
          {([0, 3, 7, -1, 3, 5, 11, -1, 3, 8, 2, -1] as CardValue[]).map((v, i) =>
            v === -1
              ? <MiniCard key={i} value={0} hidden size={36} />
              : <MiniCard key={i} value={v} size={36} />
          )}
        </div>
      </div>

      {/* Arrow */}
      <motion.div
        className="flex items-center self-center"
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <GameIcon name="fruit" size={28} />
      </motion.div>

      {/* After: column gone */}
      <div className="flex flex-col items-center gap-1">
        <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-game)' }}>Après ✨</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 36px)', gap: 4 }}>
          {([0, 3, 7, null, null, 5, 11, null, null, 8, 2, null] as (CardValue | null)[]).map((v, i) =>
            v === null ? (
              <div
                key={i}
                style={{
                  width: 36, height: 49, borderRadius: 8,
                  border: '2px dashed rgba(0,0,0,0.12)',
                }}
              />
            ) : (
              <MiniCard key={i} value={v} size={36} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: SpriteIconId;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.65)',
        borderRadius: 16,
        border: `2px solid ${color}55`,
        padding: '14px 16px',
        boxShadow: `0 2px 12px ${color}22`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <GameIcon name={icon} size={26} />
        <span
          style={{
            fontFamily: 'var(--font-game)',
            fontSize: '0.95rem',
            fontWeight: 700,
            color,
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-game)', fontSize: '0.82rem', color: '#444', lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1,   opacity: 1, y: 0  }}
            exit={{   scale: 0.5,  opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 22,
              mass: 0.9,
            }}
          >
            <div
              style={{
                maxWidth: 580,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'linear-gradient(160deg, #FFFDE7 0%, #FFF8E1 40%, #FFF3CD 100%)',
                borderRadius: 28,
                border: '4px solid #FFD700',
                boxShadow:
                  '0 0 0 2px #C9A227, 0 0 32px rgba(255,215,0,0.45), 0 20px 60px rgba(0,0,0,0.35)',
                position: 'relative',
                padding: 'clamp(14px, 4vw, 28px) clamp(12px, 4vw, 24px)',
              }}
            >
              {/* Sugar texture overlay */}
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
                  background:
                    'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.7) 0%, transparent 50%), ' +
                    'radial-gradient(ellipse at 80% 90%, rgba(255,220,100,0.2) 0%, transparent 50%)',
                }}
              />

              {/* Close button */}
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.15, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute',
                  top: 14, right: 14,
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F44336, #E91E63)',
                  border: '3px solid #FFD700',
                  boxShadow: '0 0 0 1px #C9A227, 0 4px 12px rgba(244,67,54,0.4)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                  zIndex: 10,
                }}
                aria-label="Fermer"
              >
                <GameIcon name="close" size={22} />
              </motion.button>

              {/* Title */}
              <div className="flex flex-col items-center mb-5 relative">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ lineHeight: 1, display: 'flex', justifyContent: 'center' }}
                >
                  <GameIcon name="play" size={44} />
                </motion.div>
                <h2
                  style={{
                    fontFamily: 'var(--font-game)',
                    fontSize: '1.6rem',
                    margin: '4px 0 2px',
                    background: 'linear-gradient(135deg, #E91E63, #FF9800, #FFEB3B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.1))',
                  }}
                >
                  Règles de Sugar Swap
                </h2>
                <p style={{ fontFamily: 'var(--font-game)', fontSize: '0.8rem', color: '#888', margin: 0 }}>
                  Inspiré du Skyjo — version sucrée 🍭
                </p>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3 relative">

                {/* Objectif */}
                <Section icon="hammer" title="Objectif" color="#FF9800">
                  Viser le <strong>moins de pépites</strong> pour remporter la friandise !
                  La partie s&apos;arrête quand un joueur dépasse <strong>100 pépites</strong> au total.
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {([-2, -1, 0, 3, 7, 12] as CardValue[]).map(v => (
                      <MiniCard key={v} value={v} size={36} />
                    ))}
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>de -2 à 12</span>
                  </div>
                </Section>

                {/* Mise en place */}
                <Section icon="play" title="Mise en place" color="#4CAF50">
                  Chaque joueur reçoit <strong>12 cartes</strong> bien emballées, en grille{' '}
                  <strong>4 colonnes × 3 lignes</strong>.
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 3 }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <MiniCard key={i} value={0} hidden size={30} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      Ensuite, <strong>déballez 2 cartes</strong> au choix.
                      Celui qui a la somme la plus haute ouvre le bal !
                    </span>
                  </div>
                </Section>

                {/* Tour de jeu */}
                <Section icon="hammer" title="Tour de jeu" color="#03A9F4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <span
                        style={{
                          background: '#03A9F4', color: 'white', borderRadius: '50%',
                          width: 18, height: 18, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0,
                        }}
                      >1</span>
                      <span>
                        <strong>Récolter</strong> : prenez la carte visible du{' '}
                        <strong style={{ color: '#E91E63' }}>Plateau</strong> (swap obligatoire)
                        ou une carte cachée du <strong style={{ color: '#4CAF50' }}>Paquet</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span
                        style={{
                          background: '#03A9F4', color: 'white', borderRadius: '50%',
                          width: 18, height: 18, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0,
                        }}
                      >2</span>
                      <span>
                        Si la carte vient du Paquet : <strong>swappez</strong> avec une case de votre îlot,
                        ou posez-la sur le <strong>Plateau</strong> puis <strong>déballez</strong> une carte cachée.
                      </span>
                    </div>
                  </div>
                </Section>

                {/* Règle d'or */}
                <Section icon="fruit" title="Combo Sucré !" color="#E91E63">
                  <p style={{ margin: '0 0 10px' }}>
                    <strong>3 cartes identiques</strong> dans une même colonne — <strong>POP !</strong> Colonne effacée ! ✨
                    Ces 3 cartes valent <strong>0 pépites</strong>.
                    Même un <strong style={{ color: '#7B0000' }}>12</strong> peut fondre comme une meringue !
                  </p>
                  <ColumnCombo />
                </Section>

                {/* Fin de manche */}
                <Section icon="fruit" title="Fin de manche" color="#9C27B0">
                  La manche s&apos;arrête quand un joueur a tout <strong>déballé</strong> (12 cartes visibles).
                  Les autres ont encore <strong>un dernier tour</strong> pour briller ! 🏝️
                </Section>

                {/* Doublement */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,235,59,0.25), rgba(255,152,0,0.2))',
                    borderRadius: 16,
                    border: '2px solid #FF9800',
                    padding: '14px 16px',
                    boxShadow: '0 2px 12px rgba(255,152,0,0.2)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <motion.span
                      style={{ display: 'inline-flex' }}
                      animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    >
                      <GameIcon name="close" size={28} />
                    </motion.span>
                    <span style={{
                      fontFamily: 'var(--font-game)', fontSize: '0.95rem',
                      fontWeight: 700, color: '#E65100',
                    }}>
                      Aïe ! Pépites doublées ! 🍬x2
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-game)', fontSize: '0.82rem', color: '#555', lineHeight: 1.55, margin: 0 }}>
                    Si tu finis la manche sans avoir <strong>strictement le moins de pépites</strong>,{' '}
                    tes pépites de la manche sont <strong style={{ color: '#E91E63' }}>doublées</strong> !
                    <br />
                    <span style={{ color: '#888', fontSize: '0.75rem' }}>
                      (Exception : pépites négatives ou nulles → pas de doublement)
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-3 justify-center flex-wrap">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        {([5, 3, -1, 2] as CardValue[]).map((v, i) => <MiniCard key={i} value={v} size={30} />)}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#888' }}>Tu finis : 9 pépites</span>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>vs</span>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        {([4, 4, 0, 0] as CardValue[]).map((v, i) => <MiniCard key={i} value={v} size={30} />)}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#888' }}>Adversaire : 8 pépites</span>
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg,#E91E63,#FF5722)',
                        borderRadius: 12,
                        padding: '4px 10px',
                        color: 'white',
                        fontFamily: 'var(--font-game)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '2px solid #FFD700',
                      }}
                    >
                      9 × 2 = 18 pépites
                    </div>
                  </div>
                </div>

                {/* Composition du deck */}
                <Section icon="bookPurple" title="Dans le Paquet (150 cartes)" color="#607D8B">
                  <div className="flex flex-wrap gap-2 mt-1 items-center">
                    {([
                      { v: -2, count: 5 }, { v: -1, count: 10 }, { v: 0, count: 15 },
                      { v: 1, count: 10 }, { v: 6, count: 10 }, { v: 12, count: 10 },
                    ] as { v: CardValue; count: number }[]).map(({ v, count }) => (
                      <div key={v} className="flex flex-col items-center gap-0.5">
                        <MiniCard value={v} size={32} />
                        <span style={{ fontSize: '0.62rem', color: '#888' }}>×{count}</span>
                      </div>
                    ))}
                    <span style={{ fontSize: '0.72rem', color: '#999' }}>
                      (1→12 : ×10 chacune)
                    </span>
                  </div>
                </Section>

              </div>

              {/* Footer close */}
              <div className="flex justify-center mt-5">
                <motion.button
                  className="btn-candy"
                  style={{
                    background: 'linear-gradient(135deg, #03A9F4, #4CAF50)',
                    fontSize: '0.95rem',
                    padding: '0.5rem 2rem',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                >
                  C&apos;est parti, je joue ! 🍭
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
