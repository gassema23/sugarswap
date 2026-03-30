/**
 * Sugar Swap — Sound Design (Web Audio API, no external files)
 *
 * Style: Candy Crush — bubbly, sweet, saturated, bright arpeggios.
 * Every sound is procedurally synthesised:
 *   Triangle/sine oscillators for the warm "candy" tone
 *   Layered harmonics (octave + fifth) for shimmer
 *   Fast attack (1–5 ms), short decay, no sustain → staccato feel
 *   Micro-detuning between layers → sparkle / chorus effect
 */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(v: boolean) { muted = v; }
export function isMuted() { return muted; }

function getCtx(): AudioContext {
  if (muted) throw new Error('muted');
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Emit a single "candy note" — triangle wave + octave sine harmonic.
 * @param freq   Fundamental frequency (Hz)
 * @param t      Start time (AudioContext seconds)
 * @param dur    Decay duration (seconds)
 * @param vol    Peak gain (0–1)
 * @param detune Cents of detuning on the harmonic (shimmer effect)
 */
function candyNote(
  ac: AudioContext,
  freq: number,
  t: number,
  dur: number,
  vol: number,
  detune = 0,
) {
  // Fundamental — triangle for warmth
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  osc.detune.value = detune;

  // Octave harmonic — sine for sparkle
  const harm = ac.createOscillator();
  harm.type = 'sine';
  harm.frequency.value = freq * 2;
  harm.detune.value = detune + 4; // slightly detuned for shimmer

  const harmGain = ac.createGain();
  harmGain.gain.value = 0.28;

  const env = ac.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(vol, t + 0.008);   // snap attack
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(env);
  harm.connect(harmGain);
  harmGain.connect(env);
  env.connect(ac.destination);

  osc.start(t); osc.stop(t + dur + 0.02);
  harm.start(t); harm.stop(t + dur + 0.02);
}

/** Short noise burst (papery / swishy texture) */
function noiseBurst(
  ac: AudioContext,
  t: number,
  dur: number,
  vol: number,
  filterFreq: number,
  filterType: BiquadFilterType = 'bandpass',
) {
  const len = Math.floor(ac.sampleRate * (dur + 0.02));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;

  const flt = ac.createBiquadFilter();
  flt.type = filterType;
  flt.frequency.value = filterFreq;
  flt.Q.value = 1.5;

  const env = ac.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(flt); flt.connect(env); env.connect(ac.destination);
  src.start(t); src.stop(t + dur + 0.02);
}

// ─── 1. Card flip ─────────────────────────────────────────────────────────────
// Physical: snap (click) + papery whoosh + landing thud
export function playFlip() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Snap
    {
      const len = Math.floor(ac.sampleRate * 0.014);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
      const src = ac.createBufferSource(); src.buffer = buf;
      const hpf = ac.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 3500;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.5, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.014);
      src.connect(hpf); hpf.connect(g); g.connect(ac.destination);
      src.start(now); src.stop(now + 0.016);
    }
    // Whoosh
    {
      const len = Math.floor(ac.sampleRate * 0.15);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf;
      const bpf = ac.createBiquadFilter(); bpf.type = 'bandpass'; bpf.Q.value = 1.8;
      bpf.frequency.setValueAtTime(2400, now + 0.01);
      bpf.frequency.exponentialRampToValueAtTime(700, now + 0.14);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.35, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      src.connect(bpf); bpf.connect(g); g.connect(ac.destination);
      src.start(now + 0.01); src.stop(now + 0.16);
    }
    // Thud
    {
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(135, now + 0.13);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.19);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, now + 0.13);
      g.gain.linearRampToValueAtTime(0.20, now + 0.138);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.connect(g); g.connect(ac.destination);
      osc.start(now + 0.13); osc.stop(now + 0.21);
    }
  } catch { /* non-critical */ }
}

// ─── 2. Card deal (card flying to grid) ──────────────────────────────────────
// Light "swish" + tiny candy ping on landing
export function playDeal(index = 0) {
  try {
    const ac = getCtx();
    const t = ac.currentTime + index * 0.04;

    // Swish
    noiseBurst(ac, t, 0.07, 0.08, 3000 - index * 60, 'highpass');
    // Tiny landing ping (slight pitch variation per card)
    candyNote(ac, 880 + index * 12, t + 0.06, 0.12, 0.06);
  } catch { /* non-critical */ }
}

// ─── 3. Draw from deck ────────────────────────────────────────────────────────
// Satisfying "slide + lift" — papery scrape ascending
export function playDrawDeck() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Scrape noise
    const len = Math.floor(ac.sampleRate * 0.12);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const bpf = ac.createBiquadFilter(); bpf.type = 'bandpass'; bpf.Q.value = 2;
    bpf.frequency.setValueAtTime(900, now);
    bpf.frequency.exponentialRampToValueAtTime(2200, now + 0.1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    src.connect(bpf); bpf.connect(g); g.connect(ac.destination);
    src.start(now); src.stop(now + 0.14);

    // Candy "lift" note
    candyNote(ac, 622, now + 0.09, 0.14, 0.10);
  } catch { /* non-critical */ }
}

// ─── 4. Draw from discard ─────────────────────────────────────────────────────
// Bubbly "pop + pickup" — ascending portamento
export function playDrawDiscard() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Ascending portamento sine
    const osc = ac.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g); g.connect(ac.destination);
    osc.start(now); osc.stop(now + 0.12);

    // Candy note on top
    candyNote(ac, 784, now + 0.07, 0.15, 0.12, -3);
  } catch { /* non-critical */ }
}

// ─── 5. Discard drawn card ────────────────────────────────────────────────────
// "Swish away" — descending filtered noise
export function playDiscard() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    const len = Math.floor(ac.sampleRate * 0.11);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const bpf = ac.createBiquadFilter(); bpf.type = 'bandpass'; bpf.Q.value = 1.4;
    bpf.frequency.setValueAtTime(2000, now);
    bpf.frequency.exponentialRampToValueAtTime(500, now + 0.10);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    src.connect(bpf); bpf.connect(g); g.connect(ac.destination);
    src.start(now); src.stop(now + 0.13);
  } catch { /* non-critical */ }
}

// ─── 6. Swap card with grid ───────────────────────────────────────────────────
// "Thunk" (low placement) + sparkle confirmation
export function playSwapCard() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Placement thud
    const osc = ac.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    osc.connect(g); g.connect(ac.destination);
    osc.start(now); osc.stop(now + 0.11);

    // Sparkle confirmation
    candyNote(ac, 1047, now + 0.06, 0.18, 0.10, 0);
    candyNote(ac, 1319, now + 0.10, 0.16, 0.07, 5);
  } catch { /* non-critical */ }
}

// ─── 7. Column eliminated ─────────────────────────────────────────────────────
// 3-card sparkle arpeggio → resolution chord + glitter noise
export function playColumnEliminated() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // 3 "pop" notes matching the 3 eliminated cards
    const pops = [523, 659, 784]; // C5 E5 G5
    pops.forEach((freq, i) => {
      const t = now + i * 0.07;
      candyNote(ac, freq, t, 0.22, 0.18, i * 3);
      // Glitter noise on each pop
      noiseBurst(ac, t, 0.05, 0.07, freq * 1.5, 'highpass');
    });

    // Resolution — bright C major chord
    const chord = [1047, 1319, 1568]; // C6 E6 G6
    chord.forEach((freq, i) => {
      candyNote(ac, freq, now + 0.25, 0.55, 0.12 - i * 0.02, i * 6);
    });

    // Final glitter burst
    noiseBurst(ac, now + 0.24, 0.12, 0.09, 4000, 'highpass');
  } catch { /* non-critical */ }
}

// ─── 8. Your turn notification ────────────────────────────────────────────────
// Soft two-note "ding ding" — gentle, not intrusive
export function playTurnStart() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    candyNote(ac, 659, now,        0.22, 0.10);  // E5
    candyNote(ac, 784, now + 0.12, 0.28, 0.12);  // G5
  } catch { /* non-critical */ }
}

// ─── 9. Round end ─────────────────────────────────────────────────────────────
// Short ascending fanfare — celebratory but compact
export function playRoundEnd() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      candyNote(ac, freq, now + i * 0.10, 0.30, 0.14 - i * 0.01, i * 4);
    });
    noiseBurst(ac, now + 0.32, 0.15, 0.07, 3500, 'highpass');
  } catch { /* non-critical */ }
}

// ─── 10. Score doubled (penalty) ──────────────────────────────────────────────
// Descending "womp womp" — sympathetic, not too harsh
export function playScoreDoubled() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 466, 415]; // C5 → Bb4 → Ab4
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator(); osc.type = 'triangle';
      osc.frequency.value = freq;
      const g = ac.createGain();
      const t = now + i * 0.14;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(g); g.connect(ac.destination);
      osc.start(t); osc.stop(t + 0.28);
    });
  } catch { /* non-critical */ }
}

// ─── 11. Victory jingle ───────────────────────────────────────────────────────
// Candy Crush style — 6-note ascending + flourish
export function playVictory() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Ascending melody C5–G6
    const melody = [523, 659, 784, 1047, 1319, 1568];
    melody.forEach((freq, i) => {
      candyNote(ac, freq, now + i * 0.10, 0.35, 0.15, i * 5);
    });

    // Chord resolution at end
    [1047, 1319, 1568].forEach((freq, i) => {
      candyNote(ac, freq, now + 0.70, 0.80, 0.13, i * 4);
    });

    // Glitter burst at the peak
    noiseBurst(ac, now + 0.55, 0.20, 0.10, 5000, 'highpass');
    noiseBurst(ac, now + 0.72, 0.25, 0.08, 4000, 'highpass');
  } catch { /* non-critical */ }
}

// ─── 12. Defeat ───────────────────────────────────────────────────────────────
// Slow descending notes — sad but cute
export function playDefeat() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 466, 440, 392]; // C5 Bb4 A4 G4
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator(); osc.type = 'triangle';
      osc.frequency.value = freq;
      const vib = ac.createOscillator(); vib.frequency.value = 5;
      const vibG = ac.createGain(); vibG.gain.value = freq * 0.012;
      vib.connect(vibG); vibG.connect(osc.frequency);
      const g = ac.createGain();
      const t = now + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.13, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.connect(g); g.connect(ac.destination);
      osc.start(t); vib.start(t);
      osc.stop(t + 0.38); vib.stop(t + 0.38);
    });
  } catch { /* non-critical */ }
}

// ─── 13. Button click ─────────────────────────────────────────────────────────
// Soft "pop" — light and snappy
export function playButtonClick() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g); g.connect(ac.destination);
    osc.start(now); osc.stop(now + 0.08);
  } catch { /* non-critical */ }
}

// ─── 14. Game start ───────────────────────────────────────────────────────────
// Short upward "whoosh + sparkle" — game is beginning!
export function playGameStart() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Rising sweep
    const osc = ac.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    const lpf = ac.createBiquadFilter(); lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(400, now);
    lpf.frequency.exponentialRampToValueAtTime(3000, now + 0.25);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(lpf); lpf.connect(g); g.connect(ac.destination);
    osc.start(now); osc.stop(now + 0.30);

    // Sparkle chord at the end
    [784, 1047, 1319].forEach((freq, i) =>
      candyNote(ac, freq, now + 0.22 + i * 0.06, 0.35, 0.13, i * 5)
    );
  } catch { /* non-critical */ }
}
