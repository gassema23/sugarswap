import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

// ─── Action constants (must match sugar_swap_env.py) ─────────────────────────

const N_ACTIONS        = 27;
const ACT_DRAW_DECK    = 0;
const ACT_DRAW_DISCARD = 1;
const ACT_SWAP_START   = 2;   // 2–13
const ACT_DISCARD_CARD = 14;
const ACT_REVEAL_START = 15;  // 15–26

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Loads the exported PPO ONNX model and runs inference for the expert AI.
 *
 * The model file is expected at:
 *   backend/src/ai/model/ppo_sugar_swap.onnx
 *
 * If the file is not present the service falls back to a greedy heuristic
 * so the game remains fully functional without the trained model.
 */
@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private session: import('onnxruntime-node').InferenceSession | null = null;
  private readonly modelPath = join(__dirname, 'model', 'ppo_sugar_swap.onnx');

  async onModuleInit(): Promise<void> {
    if (!existsSync(this.modelPath)) {
      this.logger.warn(
        `ONNX model not found at ${this.modelPath}. ` +
        'Falling back to greedy heuristic. ' +
        'Run gameai/export_onnx.py and copy the .onnx file here.',
      );
      return;
    }

    try {
      const ort = await import('onnxruntime-node');
      this.session = await ort.InferenceSession.create(this.modelPath);
      this.logger.log('PPO ONNX model loaded successfully.');
    } catch (err) {
      this.logger.error('Failed to load ONNX model — falling back to heuristic.', err);
    }
  }

  /**
   * Choose an action given the current observation vector and valid action mask.
   *
   * @param obs         Float32 observation vector of length 60.
   * @param validActions Set of legal action indices for this state.
   * @returns           The chosen action index.
   */
  async chooseAction(obs: number[], validActions: number[]): Promise<number> {
    if (!this.session || obs.length !== 60 || validActions.length === 0) {
      return this.greedyFallback(obs, validActions);
    }

    try {
      const ort   = await import('onnxruntime-node');
      const input = new ort.Tensor('float32', Float32Array.from(obs), [1, 60]);
      const result = await this.session.run({ obs: input });
      const logits = result['action_logits'].data as Float32Array;

      // Action masking: set invalid action logits to −∞
      const masked = Array.from(logits);
      const validSet = new Set(validActions);
      for (let a = 0; a < N_ACTIONS; a++) {
        if (!validSet.has(a)) masked[a] = -Infinity;
      }

      const action = masked.indexOf(Math.max(...masked));
      this.logger.debug(`ONNX → action ${action} (valid=${validActions})`);
      return action;
    } catch (err) {
      this.logger.warn('ONNX inference failed — using greedy fallback.', err);
      return this.greedyFallback(obs, validActions);
    }
  }

  // ── Greedy fallback (no ONNX model) ────────────────────────────────────────

  /**
   * Simple greedy policy used when the ONNX model is unavailable.
   * Mirrors the medium AI heuristic from gameEngine.ts.
   */
  private greedyFallback(obs: number[], validActions: number[]): number {
    if (validActions.length === 0) return ACT_DRAW_DECK;

    const HIDDEN         = -99;
    const EMPTY          = -98;
    const EXPECTED_VALUE = 760 / 150; // ≈ 5.07

    // Decode agent grid from observation (indices 0–11 = values, 12–23 = revealed flags)
    const agentValues   = obs.slice(0, 12);
    const agentRevealed = obs.slice(12, 24);
    const discardTop    = obs[48];
    const drawnCard     = obs[49];
    const drewFromDiscard = obs[57] > 0.5;
    const validSet      = new Set(validActions);

    // ── Draw phase ──────────────────────────────────────────────────────────
    if (validSet.has(ACT_DRAW_DECK) || validSet.has(ACT_DRAW_DISCARD)) {
      if (validSet.has(ACT_DRAW_DISCARD) && discardTop !== EMPTY) {
        const maxVisible = Math.max(
          ...agentValues.filter((_, i) => agentRevealed[i] > 0.5),
          -Infinity,
        );
        if (discardTop <= 4 && discardTop < maxVisible) return ACT_DRAW_DISCARD;
      }
      return ACT_DRAW_DECK;
    }

    // ── Discard or swap ─────────────────────────────────────────────────────
    const swapActions = validActions.filter(a => a >= ACT_SWAP_START && a < ACT_DISCARD_CARD);
    if (swapActions.length > 0 || validSet.has(ACT_DISCARD_CARD)) {
      let bestGain   = -Infinity;
      let bestAction = validSet.has(ACT_DISCARD_CARD) ? ACT_DISCARD_CARD : swapActions[0];

      for (const a of swapActions) {
        const pos    = a - ACT_SWAP_START;
        const v      = agentValues[pos];
        const isRev  = agentRevealed[pos] > 0.5;
        const effOld = (v === HIDDEN || !isRev) ? EXPECTED_VALUE : (v === EMPTY ? 0 : v);
        const gain   = effOld - drawnCard;
        if (gain > bestGain) { bestGain = gain; bestAction = a; }
      }

      if (bestGain > 0) return bestAction;
      if (validSet.has(ACT_DISCARD_CARD)) return ACT_DISCARD_CARD;
      return bestAction;
    }

    // ── Reveal hidden ───────────────────────────────────────────────────────
    const reveals = validActions.filter(a => a >= ACT_REVEAL_START);
    if (reveals.length > 0) return reveals[Math.floor(Math.random() * reveals.length)];

    return validActions[0];
  }
}
