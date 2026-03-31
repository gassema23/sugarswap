import { motion } from 'framer-motion';
import type { Card as CardType } from '@/features/game';
import { cardColor, cardTextColor } from '@/features/game';

interface DeckDiscardProps {
  deckCount: number;
  topDiscard: CardType | null;
  drawnCard: CardType | null;
  canDrawDiscard: boolean;
  canDrawDeck: boolean;
  canDiscardDrawn: boolean;
  onDrawDiscard: () => void;
  onDrawDeck: () => void;
  onDiscardDrawn: () => void;
  cardSize?: number;
}

function StackedDecks({ count, cardSize }: { count: number; cardSize: number }) {
  const h = Math.round(cardSize * 1.35);
  return (
    <div className="relative" style={{ width: cardSize, height: h }}>
      {[3, 2, 1].map(i => (
        <div
          key={i}
          className="absolute card-back"
          style={{ width: cardSize, height: h, top: -i * 2, left: i * 2, opacity: 0.6 }}
        />
      ))}
      <div className="absolute card-back w-full h-full" />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-game)',
          fontSize: cardSize < 50 ? '0.75rem' : '1rem',
          fontWeight: 700,
          color: 'white',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {count}
      </div>
    </div>
  );
}

export default function DeckDiscard({
  deckCount,
  topDiscard,
  drawnCard,
  canDrawDiscard,
  canDrawDeck,
  canDiscardDrawn,
  onDrawDiscard,
  onDrawDeck,
  onDiscardDrawn,
  cardSize = 68,
}: DeckDiscardProps) {
  const h        = Math.round(cardSize * 1.35);
  const fontSize = cardSize < 50 ? '1.4rem' : '2rem';
  const labelSize = cardSize < 50 ? '0.7rem' : '0.875rem';
  const isMobile = cardSize < 50;

  return (
    <div
      className={`flex flex-row items-end gap-y-2 ${isMobile ? 'gap-x-6' : 'gap-x-6'} sm:gap-x-10`}
      style={{
        padding: isMobile ? '6px 10px 8px' : '10px 16px 12px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 24px rgba(255,255,255,0.12), 0 0 48px rgba(200,120,255,0.07)',
      }}
    >

      {/* Draw pile */}
      <div className="flex flex-col items-center gap-6">
        {/* Label: desktop only */}
        <span
          className="hidden sm:block font-bold"
          style={{
            fontFamily: 'var(--font-game)',
            fontSize: labelSize,
            color: 'white',
            textShadow: '0 1px 6px rgba(0,0,0,0.7)',
          }}
        >
          Paquet ({deckCount})
        </span>
        <motion.div
          className={`relative ${canDrawDeck ? 'cursor-pointer' : 'opacity-70'}`}
          style={{ touchAction: 'manipulation' }}
          whileHover={canDrawDeck ? { scale: 1.08, y: -4 } : {}}
          whileTap={canDrawDeck ? { scale: 0.9 } : {}}
          onClick={canDrawDeck ? onDrawDeck : undefined}
        >
          <StackedDecks count={deckCount} cardSize={cardSize} />
          {canDrawDeck && (
            <motion.div
              className="absolute -inset-1 rounded-xl pointer-events-none"
              animate={{ boxShadow: ['0 0 0 2px #4CAF50', '0 0 12px 4px rgba(76,175,80,0.8)', '0 0 0 2px #4CAF50'] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Drawn card (in hand) */}
      {drawnCard && (
        <div className="flex flex-col items-center gap-6">
          {/* Label: desktop only */}
          <span
            className="hidden sm:block font-bold"
            style={{ fontFamily: 'var(--font-game)', fontSize: labelSize, color: '#FFD700', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
          >
            En main 🍬
          </span>
          <motion.div
            style={{ width: cardSize, height: h, touchAction: 'manipulation' }}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            className="relative"
          >
            <div
              className="w-full h-full card-face relative overflow-hidden"
              style={{ background: cardColor(drawnCard.value) }}
            >
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: 'var(--font-game)', fontSize, fontWeight: 900, color: cardTextColor(drawnCard.value), textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}>
                {drawnCard.value}
              </div>
              <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%)' }} />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl pointer-events-none"
              animate={{ boxShadow: ['0 0 0 2px #FFEB3B', '0 0 16px 6px rgba(255,235,59,0.9)', '0 0 0 2px #FFEB3B'] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </motion.div>
          {canDiscardDrawn && (
            <motion.button
              style={{
                background: 'linear-gradient(135deg, #FF5722, #E91E63)',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'var(--font-game)',
                fontWeight: 700,
                color: 'white',
                touchAction: 'manipulation',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                padding: isMobile ? '4px 22px' : '6px 14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
              whileTap={{ scale: 0.92 }}
              onClick={onDiscardDrawn}
            >
              {isMobile ? 'Poser ✕' : 'Sur le Plateau !'}
            </motion.button>
          )}
        </div>
      )}

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Label: desktop only */}
        <span
          className="hidden sm:block font-bold"
          style={{
            fontFamily: 'var(--font-game)',
            fontSize: labelSize,
            color: 'white',
            textShadow: '0 1px 6px rgba(0,0,0,0.7)',
          }}
        >
          Plateau
        </span>
        <motion.div
          className={`relative ${canDrawDiscard ? 'cursor-pointer' : 'opacity-70'}`}
          style={{ width: cardSize, height: h, touchAction: 'manipulation' }}
          whileHover={canDrawDiscard ? { scale: 1.08, y: -4 } : {}}
          whileTap={canDrawDiscard ? { scale: 0.9 } : {}}
          onClick={canDrawDiscard ? onDrawDiscard : undefined}
        >
          {topDiscard ? (
            <>
              <div
                className="w-full h-full card-face relative overflow-hidden"
                style={{ background: cardColor(topDiscard.value) }}
              >
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ fontFamily: 'var(--font-game)', fontSize, fontWeight: 900, color: cardTextColor(topDiscard.value), textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}
                >
                  {topDiscard.value}
                </div>
                <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 45%, transparent 70%)' }} />
              </div>
              {canDrawDiscard && (
                <motion.div
                  className="absolute -inset-1 rounded-xl pointer-events-none"
                  animate={{ boxShadow: ['0 0 0 2px #FFD700', '0 0 12px 4px rgba(255,215,0,0.8)', '0 0 0 2px #FFD700'] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center text-white/40" style={{ fontSize: labelSize }}>
              ✨
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}
