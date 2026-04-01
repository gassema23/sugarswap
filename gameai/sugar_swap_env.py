"""
sugar_swap_env.py — Gymnasium environment for the Sugar Swap card game.

Mirrors the logic of frontend/src/engine/gameEngine.ts exactly.

Deck: 150 cards, values -2 to 12.
Grid: 3 rows × 4 cols per player (12 cards each).
Goal: lowest total score across rounds (game ends when a player hits ≥ 100).

Special sentinel values used in observations:
  HIDDEN = -99  → card exists face-down (value unknown)
  EMPTY  = -98  → slot is empty (column was eliminated)

Action space (Discrete, 27):
  0      → Draw from deck
  1      → Draw from discard pile
  2–13   → Swap drawn card with grid position pos = action − 2
             (pos = row * 4 + col,  rows 0-2, cols 0-3)
  14     → Discard the drawn card (only valid if it came from the deck)
  15–26  → Reveal hidden card at position pos = action − 15

During initial_reveal phase only actions 15–26 (reveal) are valid.

Observation space (Box float32, shape=(60,)):
  [0:12]   Agent grid values        (HIDDEN / EMPTY / actual value)
  [12:24]  Agent grid revealed flag  (0.0 = face-down or empty, 1.0 = revealed)
  [24:36]  Opponent visible values   (HIDDEN for face-down, EMPTY for eliminated)
  [36:48]  Opponent grid revealed flag
  [48]     Top of discard pile       (EMPTY if pile is empty)
  [49]     Drawn card value          (HIDDEN if none in hand)
  [50]     Phase                     (0=initial_reveal 1=playing 2=last_round)
  [51]     Turn phase                (0=draw 1=discard_or_swap 2=reveal_hidden)
  [52]     Agent total score
  [53]     Opponent total score
  [54]     Agent hidden card count   (normalised by 12)
  [55]     Opponent hidden card count
  [56]     Deck cards remaining      (normalised by 150)
  [57]     Drew-from-discard flag    (1.0 → must swap, cannot discard)
  [58]     Round number              (normalised by 10)
  [59]     Agent score advantage     (opponent_score − agent_score, clipped ±100)
"""

from __future__ import annotations

import random
from typing import Optional

import numpy as np
import gymnasium as gym
from gymnasium import spaces

# ─── Deck ────────────────────────────────────────────────────────────────────

# Mirrors DISTRIBUTION in deck.ts
_CARD_DISTRIBUTION: list[tuple[int, int]] = (
    [(-2, 5), (-1, 10), (0, 15)]
    + [(v, 10) for v in range(1, 13)]
)  # 150 cards total

_EXPECTED_VALUE: float = sum(v * n for v, n in _CARD_DISTRIBUTION) / 150  # ≈ 5.07


def _build_deck() -> list[int]:
    deck: list[int] = []
    for value, count in _CARD_DISTRIBUTION:
        deck.extend([value] * count)
    return deck


def _shuffle(deck: list[int]) -> list[int]:
    d = deck.copy()
    random.shuffle(d)
    return d


# ─── Constants ───────────────────────────────────────────────────────────────

ROWS = 3
COLS = 4
N_CELLS = ROWS * COLS          # 12 cells per player
N_PLAYERS = 2

HIDDEN = -99    # face-down card (value unknown to the observer)
EMPTY  = -98    # eliminated slot (column was removed)

# Action indices
ACT_DRAW_DECK    = 0
ACT_DRAW_DISCARD = 1
ACT_SWAP_START   = 2           # 2 … 13  (pos = action − 2)
ACT_DISCARD_CARD = 14
ACT_REVEAL_START = 15          # 15 … 26 (pos = action − 15)
N_ACTIONS        = 27

# Phase / turn-phase encodings for the observation vector
_PHASE_ENC  = {"initial_reveal": 0, "playing": 1, "last_round": 2,
               "round_end": 3, "game_over": 4}
_TPHASE_ENC = {"draw": 0, "discard_or_swap": 1, "reveal_hidden": 2}


# ─── Environment ─────────────────────────────────────────────────────────────

class SugarSwapEnv(gym.Env):
    """
    Sugar Swap two-player card game as a Gymnasium environment.

    The RL agent controls **player 0**.
    **Player 1** is driven by a built-in policy (``opponent_policy``):
      • ``"greedy"``  — simple value-based heuristic (mirrors medium AI in TS)
      • ``"random"``  — uniformly random valid action

    After every agent ``step()``, the environment automatically advances
    opponent turns until it is the agent's turn again.  Multi-round games
    run to completion (``terminated=True`` only on game_over).
    """

    metadata = {"render_modes": ["human"]}

    def __init__(
        self,
        render_mode: Optional[str] = None,
        opponent_policy: str = "greedy",
        illegal_action_penalty: float = -5.0,
    ) -> None:
        super().__init__()

        self.render_mode            = render_mode
        self.opponent_policy        = opponent_policy
        self.illegal_action_penalty = illegal_action_penalty

        # Observation space ────────────────────────────────────────────────
        low  = np.full(60, -100.0, dtype=np.float32)
        high = np.full(60,  200.0, dtype=np.float32)
        self.observation_space = spaces.Box(low=low, high=high, dtype=np.float32)

        # Action space ─────────────────────────────────────────────────────
        self.action_space = spaces.Discrete(N_ACTIONS)

        # Internal game state (populated by reset / _init_game)
        self._s: dict = {}

    # ── Gymnasium interface ───────────────────────────────────────────────────

    def reset(
        self,
        seed: Optional[int] = None,
        options: Optional[dict] = None,
    ) -> tuple[np.ndarray, dict]:
        super().reset(seed=seed)
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

        self._init_game()
        self._advance_opponent()          # let opponent do its initial reveals if it goes first

        return self._obs(), self._info()

    def step(self, action: int) -> tuple[np.ndarray, float, bool, bool, dict]:
        assert self._s, "Call reset() first."

        reward, terminated, illegal = self._apply_action(action)

        if illegal:
            return self._obs(), reward, False, False, self._info()

        # Auto-play opponent and start new rounds until it is agent's turn
        if not terminated:
            self._advance_opponent()

        # Terminal reward after final state is stable
        if self._s["phase"] == "game_over":
            terminated = True
            agent_score = self._s["total_scores"][0]
            opp_score   = self._s["total_scores"][1]
            if agent_score < opp_score:
                reward += 20.0          # win bonus
            elif agent_score > opp_score:
                reward -= 10.0          # lose penalty
            # Penalise high raw score (lower is always better)
            reward -= agent_score / 20.0

        return self._obs(), reward, terminated, False, self._info()

    def render(self) -> None:
        if self.render_mode != "human":
            return
        s = self._s
        print(f"\n=== Round {s['round_number']} | {s['phase']} / {s['turn_phase']} | "
              f"Current: P{s['current_player']} ===")
        for p in range(N_PLAYERS):
            print(f"  Player {p}  total={s['total_scores'][p]}")
            for r in range(ROWS):
                row_str = "    "
                for c in range(COLS):
                    v = s["grids"][p][r][c]
                    if v == EMPTY:
                        row_str += " [   ]"
                    elif v == HIDDEN:
                        row_str += " [ ? ]"
                    else:
                        row_str += f" [{v:3d}]"
                print(row_str)
        top = s["discard_pile"][-1] if s["discard_pile"] else "—"
        print(f"  Discard top: {top}  |  Drawn: {s['drawn_card']}  "
              f"(from_discard={s['drew_from_discard']})")

    # ── Game initialisation ───────────────────────────────────────────────────

    def _init_game(self) -> None:
        deck = _shuffle(_build_deck())

        grids:  list[list[list[int]]] = []   # visible representation
        actual: list[list[list[int]]] = []   # true (hidden) values

        idx = 0
        for _ in range(N_PLAYERS):
            g, a = [], []
            for r in range(ROWS):
                row_g, row_a = [], []
                for c in range(COLS):
                    row_g.append(HIDDEN)
                    row_a.append(deck[idx])
                    idx += 1
                g.append(row_g)
                a.append(row_a)
            grids.append(g)
            actual.append(a)

        remaining     = deck[idx:]
        first_discard = remaining.pop(0)

        self._s = {
            "grids":           grids,
            "actual":          actual,
            "deck":            remaining,
            "discard_pile":    [first_discard],
            "current_player":  0,
            "phase":           "initial_reveal",
            "turn_phase":      "draw",         # unused during initial_reveal
            "drawn_card":      None,
            "drew_from_discard": False,
            "last_round_player": None,
            "round_number":    1,
            "total_scores":    [0, 0],
            "initial_left":    [2, 2],         # cards each player must reveal
        }

    def _start_new_round(self) -> None:
        """Set up the next round (called when phase == 'round_end')."""
        s = self._s
        if s["phase"] != "round_end":
            return

        deck  = _shuffle(_build_deck())
        grids: list[list[list[int]]] = []
        actual: list[list[list[int]]] = []

        idx = 0
        for _ in range(N_PLAYERS):
            g, a = [], []
            for r in range(ROWS):
                row_g, row_a = [], []
                for c in range(COLS):
                    row_g.append(HIDDEN)
                    row_a.append(deck[idx])
                    idx += 1
                g.append(row_g)
                a.append(row_a)
            grids.append(g)
            actual.append(a)

        remaining     = deck[idx:]
        first_discard = remaining.pop(0)

        # Player with HIGHEST total score starts the new round (worst off → goes first)
        start = int(np.argmax(s["total_scores"]))

        s.update({
            "grids":           grids,
            "actual":          actual,
            "deck":            remaining,
            "discard_pile":    [first_discard],
            "current_player":  start,
            "phase":           "initial_reveal",
            "turn_phase":      "draw",
            "drawn_card":      None,
            "drew_from_discard": False,
            "last_round_player": None,
            "round_number":    s["round_number"] + 1,
            "initial_left":    [2, 2],
        })

    # ── Observation ───────────────────────────────────────────────────────────

    def _obs(self) -> np.ndarray:
        s   = self._s
        obs = np.zeros(60, dtype=np.float32)

        # Agent grid (player 0)
        for r in range(ROWS):
            for c in range(COLS):
                pos = r * COLS + c
                v   = s["grids"][0][r][c]
                obs[pos]      = float(v)
                obs[12 + pos] = 0.0 if v in (HIDDEN, EMPTY) else 1.0

        # Opponent grid (player 1) — only revealed cards are visible
        for r in range(ROWS):
            for c in range(COLS):
                pos = r * COLS + c
                v   = s["grids"][1][r][c]
                obs[24 + pos] = float(v)
                obs[36 + pos] = 0.0 if v in (HIDDEN, EMPTY) else 1.0

        obs[48] = float(s["discard_pile"][-1]) if s["discard_pile"] else float(EMPTY)
        obs[49] = float(s["drawn_card"]) if s["drawn_card"] is not None else float(HIDDEN)
        obs[50] = float(_PHASE_ENC.get(s["phase"], 0))
        obs[51] = float(_TPHASE_ENC.get(s["turn_phase"], 0))
        obs[52] = float(s["total_scores"][0])
        obs[53] = float(s["total_scores"][1])

        agent_hidden = sum(
            1 for r in range(ROWS) for c in range(COLS)
            if s["grids"][0][r][c] == HIDDEN
        )
        opp_hidden = sum(
            1 for r in range(ROWS) for c in range(COLS)
            if s["grids"][1][r][c] == HIDDEN
        )
        obs[54] = agent_hidden  / N_CELLS
        obs[55] = opp_hidden    / N_CELLS
        obs[56] = len(s["deck"]) / 150.0
        obs[57] = 1.0 if s["drew_from_discard"] else 0.0
        obs[58] = s["round_number"] / 10.0
        obs[59] = float(np.clip(s["total_scores"][1] - s["total_scores"][0], -100, 100))

        return obs

    def _info(self) -> dict:
        s = self._s
        return {
            "phase":          s["phase"],
            "turn_phase":     s["turn_phase"],
            "current_player": s["current_player"],
            "total_scores":   list(s["total_scores"]),
            "round_number":   s["round_number"],
            "valid_actions":  sorted(self._valid_actions()),
        }

    # ── Valid actions ─────────────────────────────────────────────────────────

    def _valid_actions(self, player: Optional[int] = None) -> set[int]:
        """Return the set of legal action indices for `player` (default: current_player)."""
        s = self._s
        if player is None:
            player = s["current_player"]
        valid: set[int] = set()

        if s["phase"] == "initial_reveal":
            for r in range(ROWS):
                for c in range(COLS):
                    if s["grids"][player][r][c] == HIDDEN:
                        valid.add(ACT_REVEAL_START + r * COLS + c)
            return valid

        if s["phase"] not in ("playing", "last_round"):
            return valid

        if s["turn_phase"] == "draw":
            valid.add(ACT_DRAW_DECK)
            if s["discard_pile"]:
                valid.add(ACT_DRAW_DISCARD)

        elif s["turn_phase"] == "discard_or_swap":
            for r in range(ROWS):
                for c in range(COLS):
                    if s["grids"][player][r][c] != EMPTY:
                        valid.add(ACT_SWAP_START + r * COLS + c)
            # Can only discard if the drawn card came from the deck
            if not s["drew_from_discard"]:
                valid.add(ACT_DISCARD_CARD)

        elif s["turn_phase"] == "reveal_hidden":
            for r in range(ROWS):
                for c in range(COLS):
                    if s["grids"][player][r][c] == HIDDEN:
                        valid.add(ACT_REVEAL_START + r * COLS + c)

        return valid

    # ── Action application ────────────────────────────────────────────────────

    def _apply_action(self, action: int) -> tuple[float, bool, bool]:
        """
        Apply action for the current player.
        Returns (reward, terminated, is_illegal).
        """
        s     = self._s
        valid = self._valid_actions()

        if action not in valid:
            return self.illegal_action_penalty, False, True

        reward     = -0.1          # small per-step cost
        terminated = False
        player     = s["current_player"]

        # ── Initial reveal ────────────────────────────────────────────────
        if s["phase"] == "initial_reveal":
            pos = action - ACT_REVEAL_START
            r, c = divmod(pos, COLS)
            reward += self._do_initial_reveal(player, r, c)
            return reward, False, False

        # ── Draw ──────────────────────────────────────────────────────────
        if s["turn_phase"] == "draw":
            if action == ACT_DRAW_DECK:
                self._replenish_deck()
                card = s["deck"].pop(0)
                s["drawn_card"]        = card
                s["drew_from_discard"] = False
                s["turn_phase"]        = "discard_or_swap"

            elif action == ACT_DRAW_DISCARD:
                card = s["discard_pile"].pop()
                s["drawn_card"]        = card
                s["drew_from_discard"] = True
                s["turn_phase"]        = "discard_or_swap"

        # ── Discard or swap ───────────────────────────────────────────────
        elif s["turn_phase"] == "discard_or_swap":
            if action == ACT_DISCARD_CARD:
                s["discard_pile"].append(s["drawn_card"])
                s["drawn_card"]        = None
                s["drew_from_discard"] = False
                s["turn_phase"]        = "reveal_hidden"

            elif ACT_SWAP_START <= action < ACT_DISCARD_CARD:
                pos = action - ACT_SWAP_START
                r, c = divmod(pos, COLS)
                reward    += self._do_swap(player, r, c)
                terminated = self._end_turn()

        # ── Reveal hidden ─────────────────────────────────────────────────
        elif s["turn_phase"] == "reveal_hidden":
            pos = action - ACT_REVEAL_START
            r, c = divmod(pos, COLS)
            reward    += self._do_reveal(player, r, c)
            terminated = self._end_turn()

        return reward, terminated, False

    # ── Game logic ────────────────────────────────────────────────────────────

    def _do_initial_reveal(self, player: int, r: int, c: int) -> float:
        """Reveal one card during the initial_reveal phase. Returns reward."""
        s = self._s
        actual_val = s["actual"][player][r][c]
        s["grids"][player][r][c] = actual_val
        s["initial_left"][player] -= 1

        if s["initial_left"][player] == 0:
            # This player finished their initial reveal; move to next
            next_p = (player + 1) % N_PLAYERS
            s["current_player"] = next_p

            if all(n == 0 for n in s["initial_left"]):
                # All players done → determine who goes first (highest visible score)
                visible_scores = [
                    sum(
                        s["grids"][p][rr][cc]
                        for rr in range(ROWS) for cc in range(COLS)
                        if s["grids"][p][rr][cc] not in (HIDDEN, EMPTY)
                    )
                    for p in range(N_PLAYERS)
                ]
                s["current_player"] = int(np.argmax(visible_scores))
                s["phase"]          = "playing"
                s["turn_phase"]     = "draw"

        return 0.0   # no intermediate reward for initial reveals

    def _do_swap(self, player: int, r: int, c: int) -> float:
        """Swap drawn card with grid[player][r][c]. Returns shaped reward."""
        s = self._s

        drawn     = s["drawn_card"]
        old_vis   = s["grids"][player][r][c]      # HIDDEN / EMPTY / value
        old_actual = s["actual"][player][r][c]

        # The displaced card goes to the discard (face-up, so its actual value)
        s["discard_pile"].append(old_actual)

        # Place drawn card (now revealed) in the grid
        s["grids"][player][r][c]  = drawn
        s["actual"][player][r][c] = drawn
        s["drawn_card"]            = None
        s["drew_from_discard"]     = False

        # Shaped reward: improvement over what was there (or expected value if hidden)
        effective_old = _EXPECTED_VALUE if old_vis == HIDDEN else (0.0 if old_vis == EMPTY else old_vis)
        reward = (effective_old - drawn) * 0.5

        reward += self._eliminate_columns(player)
        return reward

    def _do_reveal(self, player: int, r: int, c: int) -> float:
        """Flip a hidden card face-up. Returns shaped reward."""
        s = self._s
        actual_val = s["actual"][player][r][c]
        s["grids"][player][r][c] = actual_val

        # Small reward for revealing a below-average card (gives info + is good)
        reward = (_EXPECTED_VALUE - actual_val) * 0.1
        reward += self._eliminate_columns(player)
        return reward

    def _eliminate_columns(self, player: int) -> float:
        """
        Check all columns for 3 identical revealed values; eliminate them.
        Mirrors checkAndEliminateColumns + eliminateColumn in gameEngine.ts.
        Returns total reward from eliminated columns.
        """
        s      = self._s
        reward = 0.0

        changed = True
        while changed:
            changed = False
            for c in range(COLS):
                col = [s["grids"][player][r][c] for r in range(ROWS)]
                # Eliminate only if all three slots are non-HIDDEN, non-EMPTY, and equal
                if (
                    all(v not in (HIDDEN, EMPTY) for v in col)
                    and len(set(col)) == 1
                ):
                    elim_val = col[0]
                    # Push cards to discard
                    for r in range(ROWS):
                        s["discard_pile"].append(s["grids"][player][r][c])
                        s["grids"][player][r][c]  = EMPTY
                        s["actual"][player][r][c] = 0
                    # Reward: flat bonus + proportional to value of eliminated cards
                    # (removing high-value cards is great; removing low/negative is neutral)
                    reward  += 10.0
                    reward  += max(0, elim_val) * 3 * 0.3
                    changed  = True
                    break   # restart scan

        return reward

    def _end_turn(self) -> bool:
        """
        Advance game state after a player finishes their turn.
        Mirrors endTurn + endRound in gameEngine.ts.
        Returns True if the round (or game) ended.
        """
        s      = self._s
        player = s["current_player"]

        # Has this player revealed all their cards? (EMPTY slots are fine)
        all_revealed = all(
            s["grids"][player][r][c] != HIDDEN
            for r in range(ROWS) for c in range(COLS)
        )

        if all_revealed and s["phase"] == "playing" and s["last_round_player"] is None:
            # Force-reveal any remaining hidden cards (shouldn't be any, but defensive)
            for r in range(ROWS):
                for c in range(COLS):
                    if s["grids"][player][r][c] == HIDDEN:
                        s["grids"][player][r][c] = s["actual"][player][r][c]
            s["last_round_player"] = player
            s["phase"]             = "last_round"

        next_player = (player + 1) % N_PLAYERS

        if s["phase"] == "last_round" and next_player == s["last_round_player"]:
            # Everyone has had their last turn → score the round
            self._end_round()
            if s["phase"] == "round_end":
                self._start_new_round()
            return s["phase"] == "game_over"

        s["current_player"] = next_player
        s["turn_phase"]     = "draw"
        return False

    def _end_round(self) -> None:
        """
        Score the finished round and set phase to 'round_end' or 'game_over'.
        Mirrors endRound in gameEngine.ts including the doubling rule.
        """
        s = self._s

        # Reveal ALL cards
        for p in range(N_PLAYERS):
            for r in range(ROWS):
                for c in range(COLS):
                    if s["grids"][p][r][c] == HIDDEN:
                        s["grids"][p][r][c] = s["actual"][p][r][c]

        # Full grid scores (EMPTY slots contribute 0)
        round_scores = [
            sum(
                s["grids"][p][r][c]
                for r in range(ROWS) for c in range(COLS)
                if s["grids"][p][r][c] != EMPTY
            )
            for p in range(N_PLAYERS)
        ]

        finisher      = s["last_round_player"]
        finisher_score = round_scores[finisher]
        others_min    = min(round_scores[p] for p in range(N_PLAYERS) if p != finisher)

        # Doubling rule: finisher must be strictly less than ALL others
        if finisher_score > 0 and finisher_score >= others_min:
            round_scores[finisher] *= 2

        for p in range(N_PLAYERS):
            s["total_scores"][p] += round_scores[p]

        s["phase"] = "game_over" if any(sc >= 100 for sc in s["total_scores"]) else "round_end"

    def _replenish_deck(self) -> None:
        """Reshuffle discard pile into deck if the deck is empty."""
        s = self._s
        if s["deck"] or len(s["discard_pile"]) <= 1:
            return
        top       = s["discard_pile"].pop()
        s["deck"] = _shuffle(s["discard_pile"])
        s["discard_pile"] = [top]

    # ── Opponent auto-play ────────────────────────────────────────────────────

    def _advance_opponent(self) -> None:
        """
        Keep playing until it is the agent's (player 0) turn or the game ends.
        Also handles automatic new-round setup between rounds.
        """
        s         = self._s
        max_steps = 1000    # safety cap against infinite loops

        for _ in range(max_steps):
            if s["phase"] in ("game_over",):
                break
            if s["phase"] == "round_end":
                self._start_new_round()
                continue
            if s["current_player"] == 0:
                break
            action = self._opponent_action()
            self._apply_action(action)

    def _opponent_action(self) -> int:
        """Return an action for the opponent (player 1) using the configured policy."""
        s     = self._s
        valid = self._valid_actions(player=s["current_player"])

        if not valid:
            return ACT_DRAW_DECK

        if self.opponent_policy == "random":
            return random.choice(sorted(valid))

        # ── Greedy policy (mirrors medium AI heuristic from gameEngine.ts) ──
        phase = s["phase"]
        opp   = s["current_player"]

        if phase == "initial_reveal":
            reveals = [a for a in valid if a >= ACT_REVEAL_START]
            return random.choice(reveals) if reveals else random.choice(sorted(valid))

        if s["turn_phase"] == "draw":
            discard_top = s["discard_pile"][-1] if s["discard_pile"] else None
            if discard_top is not None and ACT_DRAW_DISCARD in valid:
                visible = [
                    s["grids"][opp][r][c]
                    for r in range(ROWS) for c in range(COLS)
                    if s["grids"][opp][r][c] not in (HIDDEN, EMPTY)
                ]
                max_visible = max(visible) if visible else float("-inf")
                if discard_top <= 4 and discard_top < max_visible:
                    return ACT_DRAW_DISCARD
            return ACT_DRAW_DECK

        if s["turn_phase"] == "discard_or_swap":
            drawn      = s["drawn_card"]
            best_gain  = float("-inf")
            best_action: Optional[int] = None

            for a in valid:
                if ACT_SWAP_START <= a < ACT_DISCARD_CARD:
                    pos = a - ACT_SWAP_START
                    r, c = divmod(pos, COLS)
                    v    = s["grids"][opp][r][c]
                    eff  = _EXPECTED_VALUE if v == HIDDEN else v
                    gain = eff - drawn
                    if gain > best_gain:
                        best_gain  = gain
                        best_action = a

            if best_gain > 0 and best_action is not None:
                return best_action
            if ACT_DISCARD_CARD in valid:
                return ACT_DISCARD_CARD
            return random.choice(sorted(valid))

        if s["turn_phase"] == "reveal_hidden":
            reveals = [a for a in valid if a >= ACT_REVEAL_START]
            return random.choice(reveals) if reveals else random.choice(sorted(valid))

        return random.choice(sorted(valid))
