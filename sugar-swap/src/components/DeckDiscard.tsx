import { motion } from 'framer-motion';
import type { Card as CardType } from '../engine/types';
import { cardColor, cardTextColor } from '../engine/deck';

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
}

function StackedDecks({ count }: { count: number }) {
  return (
    <div className="relative" style={{ width: 68, height: 92 }}>
      {/* stack shadow layers */}
      {[3, 2, 1].map(i => (
        <div
          key={i}
          className="absolute card-back"
          style={{
            width: 68, height: 92,
            top: -i * 2, left: i * 2,
            opacity: 0.6,
          }}
        />
      ))}
      <div className="absolute card-back w-full h-full" />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-game)',
          fontSize: '1rem',
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
}: DeckDiscardProps) {
  return (
    <div className="flex flex-row items-end gap-y-4 gap-x-8">

      {/* Draw pile */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-white/70 text-sm font-bold" style={{ fontFamily: 'var(--font-game)' }}>
          Pioche ({deckCount})
        </span>
        <motion.div
          className={`relative ${canDrawDeck ? 'cursor-pointer' : 'opacity-70'}`}
          whileHover={canDrawDeck ? { scale: 1.08, y: -4 } : {}}
          whileTap={canDrawDeck ? { scale: 0.95 } : {}}
          onClick={canDrawDeck ? onDrawDeck : undefined}
        >
          <StackedDecks count={deckCount} />
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
        <div className="flex flex-col items-center gap-2">
          <span className="text-yellow-300 text-sm font-bold" style={{ fontFamily: 'var(--font-game)' }}>
            En main
          </span>
          <motion.div
            style={{ width: 68, height: 92 }}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            className="relative"
          >
            <div
              className="w-full h-full card-face relative overflow-hidden"
              style={{ background: cardColor(drawnCard.value) }}
            >
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: 'var(--font-game)', fontSize: '2rem', fontWeight: 900, color: cardTextColor(drawnCard.value), textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}>
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
            <button
              className="btn-candy text-sm"
              style={{ background: 'linear-gradient(135deg, #FF5722, #E91E63)' }}
              onClick={onDiscardDrawn}
            >
              Défausser
            </button>
          )}
        </div>
      )}

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-white/70 text-sm font-bold" style={{ fontFamily: 'var(--font-game)' }}>
          Défausse
        </span>
        <motion.div
          className={`relative ${canDrawDiscard ? 'cursor-pointer' : 'opacity-70'}`}
          style={{ width: 68, height: 92 }}
          whileHover={canDrawDiscard ? { scale: 1.1, y: -5 } : {}}
          whileTap={canDrawDiscard ? { scale: 0.95 } : {}}
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
                  style={{ fontFamily: 'var(--font-game)', fontSize: '2rem', fontWeight: 900, color: cardTextColor(topDiscard.value), textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}
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
            <div className="w-full h-full rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center text-white/40 text-sm">
              vide
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
}

