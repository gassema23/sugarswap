import { useEffect, useState } from 'react';

interface CardSizes {
  human: number;
  ai: number;
  me: number;
  deck: number;
  showAiLabel: boolean;
}

function computeSizes(): CardSizes {
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (w >= 1024) return { human: 80, ai: 80, me: 80, deck: 68, showAiLabel: true };
  if (w >= 640)  return { human: 70, ai: 70, me: 70, deck: 58, showAiLabel: true };

  // Mobile — AI gets a fixed compact size, human gets remaining height.
  // Overhead: roundLabel(28) + gap(4) + outerPy(8) = 40px
  // Real board height = badge(14) + p-2 top+bot(16) + 3*(size*0.9*1.35) + 2*gap8(16)
  //                   = 46 + size * 3.645
  // Deck zone height  = container-pad(14) + deck * 1.35  (no labels)
  const ai   = w < 400 ? 36 : 40;
  const deck = w < 400 ? 40 : 46;

  const aiBoardH  = 46 + ai   * 3.645;
  const deckZoneH = 14 + deck * 1.35;
  const overhead  = 40;

  const humanAvail  = Math.max(0, h - overhead - aiBoardH - deckZoneH);
  const humanFromH  = Math.floor((humanAvail - 46) / 3.645);
  const humanFromW  = w < 400 ? 80 : 92;
  const human       = Math.max(44, Math.min(humanFromW, humanFromH));

  return { human, ai, me: human, deck, showAiLabel: false };
}

export function useCardSizes(): CardSizes {
  const [sizes, setSizes] = useState(computeSizes);

  useEffect(() => {
    const handler = () => setSizes(computeSizes());
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return sizes;
}
