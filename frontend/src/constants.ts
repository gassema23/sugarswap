// ─── App identity ─────────────────────────────────────────────────────────────

export const APP_NAME      = 'Sugar Swap';
export const APP_DOMAIN    = 'vynia.app';

// ─── Game ─────────────────────────────────────────────────────────────────────

/** Fixed name for the AI opponent — shown in setup and recorded in match history. */
export const AI_NAME          = 'Friandise';

/** Default player name when the user is a guest. */
export const GUEST_NAME       = 'Gourmand';

/** Minimum matches required to appear on the leaderboard. */
export const LEADERBOARD_MIN_MATCHES = 5;

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** localStorage key for the JWT token. */
export const TOKEN_KEY = 'sugar_token';

// ─── UI ───────────────────────────────────────────────────────────────────────

/** Width for all main menu/lobby panels. */
export const PANEL_WIDTH = 'min(calc(100vw - 32px), 450px)';

/** Brand gold colour. */
export const COLOR_GOLD    = '#FFD700';

/** Primary pink/red gradient (buttons, CTA). */
export const GRADIENT_PRIMARY  = 'linear-gradient(135deg, #E91E63 0%, #FF9800 100%)';

/** Purple/blue gradient (online mode). */
export const GRADIENT_ONLINE   = 'linear-gradient(135deg, #7B1FA2 0%, #0288D1 100%)';

/** Green/cyan gradient (success, start). */
export const GRADIENT_SUCCESS  = 'linear-gradient(135deg, #4CAF50 0%, #03A9F4 100%)';

/** Gold gradient (title text). */
export const GRADIENT_GOLD     = 'linear-gradient(135deg, #FFE866 0%, #FFD700 45%, #FFAA00 100%)';

/** Dark candy card background (used on all menu panels). */
export const CARD_BACKGROUND = [
  'radial-gradient(ellipse at 20% 20%, rgba(180,50,255,0.08) 0%, transparent 60%)',
  'radial-gradient(ellipse at 80% 80%, rgba(255,100,50,0.06) 0%, transparent 60%)',
  'linear-gradient(165deg, rgba(28,8,68,0.97) 0%, rgba(10,4,30,0.99) 100%)',
].join(', ');

export const CARD_BORDER      = '2px solid rgba(255,205,0,0.65)';
export const CARD_BOX_SHADOW  = [
  '0 0 0 1px rgba(160,90,0,0.38)',
  '0 0 55px rgba(160,60,255,0.12)',
  '0 26px 70px rgba(0,0,0,0.72)',
  'inset 0 1px 0 rgba(255,220,100,0.32)',
  'inset 0 -1px 0 rgba(0,0,0,0.45)',
].join(', ');
