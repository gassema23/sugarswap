import { motion, AnimatePresence } from 'framer-motion';
import { cardColor, cardTextColor } from '../engine/deck';
import type { CardValue } from '../engine/types';

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
        <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-game)' }}>Avant</span>
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
        style={{ fontSize: '1.5rem', color: '#E91E63' }}
      >
        ✨
      </motion.div>

      {/* After: column gone */}
      <div className="flex flex-col items-center gap-1">
        <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-game)' }}>Après</span>
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
  icon: string;
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
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
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
                  color: 'white',
                  fontFamily: 'var(--font-game)',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                  zIndex: 10,
                }}
              >
                ✕
              </motion.button>

              {/* Title */}
              <div className="flex flex-col items-center mb-5 relative">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '2.2rem', lineHeight: 1 }}
                >
                  🍭
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
                  Basé sur les règles du Skyjo
                </p>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3 relative">

                {/* Objectif */}
                <Section icon="🏆" title="Objectif" color="#FF9800">
                  Obtenez le <strong>score le plus bas</strong> pour remporter la friandise !
                  La partie se termine quand un joueur dépasse <strong>100 points</strong> au total.
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {([-2, -1, 0, 3, 7, 12] as CardValue[]).map(v => (
                      <MiniCard key={v} value={v} size={36} />
                    ))}
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>de -2 à 12</span>
                  </div>
                </Section>

                {/* Mise en place */}
                <Section icon="🃏" title="Mise en place" color="#4CAF50">
                  Chaque joueur reçoit <strong>12 cartes</strong> face cachée, disposées en grille{' '}
                  <strong>4 colonnes × 3 lignes</strong>.
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 30px)', gap: 3 }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <MiniCard key={i} value={0} hidden size={30} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      Retournez ensuite <strong>2 cartes</strong> de votre choix.
                      Le joueur avec la somme la plus haute commence.
                    </span>
                  </div>
                </Section>

                {/* Tour de jeu */}
                <Section icon="🔄" title="Tour de jeu" color="#03A9F4">
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
                        <strong>Piocher</strong> : prenez la carte visible de la{' '}
                        <strong style={{ color: '#E91E63' }}>défausse</strong> (échange obligatoire)
                        ou une carte cachée de la <strong style={{ color: '#4CAF50' }}>pioche</strong>.
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
                        Si piochée du deck : <strong>échangez</strong> la avec une carte de votre grille,
                        ou <strong>défaussez-la</strong> et retournez une carte cachée.
                      </span>
                    </div>
                  </div>
                </Section>

                {/* Règle d'or */}
                <Section icon="✨" title="La Règle d'Or — Combo Colonne !" color="#E91E63">
                  <p style={{ margin: '0 0 10px' }}>
                    Si vous avez <strong>3 cartes identiques</strong> dans une même colonne verticale —
                    elles disparaissent ! Ces 3 cartes valent <strong>0 point</strong>.
                    Même des <strong style={{ color: '#7B0000' }}>12</strong> peuvent disparaître ! 🎉
                  </p>
                  <ColumnCombo />
                </Section>

                {/* Fin de manche */}
                <Section icon="🏁" title="Fin de manche" color="#9C27B0">
                  La manche s'arrête quand un joueur révèle sa{' '}
                  <strong>12ème carte</strong>. Les autres joueurs ont encore{' '}
                  <strong>un dernier tour</strong>.
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
                      style={{ fontSize: '1.4rem' }}
                      animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    >
                      ⚠️
                    </motion.span>
                    <span style={{
                      fontFamily: 'var(--font-game)', fontSize: '0.95rem',
                      fontWeight: 700, color: '#E65100',
                    }}>
                      Attention — Score Doublé !
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-game)', fontSize: '0.82rem', color: '#555', lineHeight: 1.55, margin: 0 }}>
                    Si vous terminez la manche mais que vous n'avez{' '}
                    <strong>pas strictement le plus petit score</strong>,{' '}
                    vos points pour cette manche sont <strong style={{ color: '#E91E63' }}>doublés</strong> !
                    <br />
                    <span style={{ color: '#888', fontSize: '0.75rem' }}>
                      (Exception : score négatif ou nul → pas de doublement)
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-3 justify-center flex-wrap">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        {([5, 3, -1, 2] as CardValue[]).map((v, i) => <MiniCard key={i} value={v} size={30} />)}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#888' }}>Tu finis : 9 pts</span>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>vs</span>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        {([4, 4, 0, 0] as CardValue[]).map((v, i) => <MiniCard key={i} value={v} size={30} />)}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#888' }}>Adversaire : 8 pts</span>
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
                      9 × 2 = 18 pts 😬
                    </div>
                  </div>
                </div>

                {/* Composition du deck */}
                <Section icon="🎴" title="Composition du deck (150 cartes)" color="#607D8B">
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
                  🍬 À moi de jouer !
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
