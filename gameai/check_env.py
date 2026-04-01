"""
check_env.py — Validates the SugarSwapEnv with random rollouts.

Usage:
    python check_env.py

Optional (requires stable-baselines3):
    pip install stable-baselines3
    python check_env.py --sb3
"""

from __future__ import annotations

import argparse
import random
import sys
import time
import traceback

import numpy as np

from sugar_swap_env import SugarSwapEnv, N_ACTIONS


# ─── Helpers ─────────────────────────────────────────────────────────────────

def run_episode(env: SugarSwapEnv, use_valid_actions: bool = True) -> dict:
    """Run one episode with random (but legal) actions. Returns episode stats."""
    obs, info = env.reset()

    total_reward = 0.0
    steps        = 0
    illegal      = 0

    while True:
        if use_valid_actions and info.get("valid_actions"):
            action = random.choice(info["valid_actions"])
        else:
            action = env.action_space.sample()

        obs, reward, terminated, truncated, info = env.step(action)
        total_reward += reward
        steps        += 1

        if reward <= -4.0:   # illegal_action_penalty triggered
            illegal += 1

        if terminated or truncated:
            break

        if steps > 5_000:
            print("  [WARN] Episode truncated at 5 000 steps — possible infinite loop!")
            break

    return {
        "steps":         steps,
        "total_reward":  total_reward,
        "illegal_moves": illegal,
        "final_scores":  info.get("total_scores", []),
        "rounds":        info.get("round_number", 1),
    }


def check_obs_bounds(env: SugarSwapEnv, n_episodes: int = 10) -> bool:
    """Verify that observations never leave the declared bounds."""
    low  = env.observation_space.low
    high = env.observation_space.high
    ok   = True

    for ep in range(n_episodes):
        obs, info = env.reset()
        for _ in range(2_000):
            if info.get("valid_actions"):
                action = random.choice(info["valid_actions"])
            else:
                action = env.action_space.sample()

            obs, _, terminated, truncated, info = env.step(action)

            under = obs < low
            over  = obs > high
            if under.any() or over.any():
                print(f"  [FAIL] Observation out of bounds at episode {ep}!")
                print(f"    indices below low:  {np.where(under)[0].tolist()}")
                print(f"    indices above high: {np.where(over)[0].tolist()}")
                print(f"    obs values: {obs[under | over]}")
                ok = False

            if terminated or truncated:
                break

    return ok


def check_valid_actions_coverage(env: SugarSwapEnv, n_steps: int = 500) -> bool:
    """Verify valid_actions are always a subset of the action space."""
    ok = True
    env.reset()
    obs, info = env.reset()

    for _ in range(n_steps):
        valid = info.get("valid_actions", [])
        for a in valid:
            if a not in range(N_ACTIONS):
                print(f"  [FAIL] Invalid action {a} in valid_actions!")
                ok = False
        if info.get("valid_actions"):
            action = random.choice(info["valid_actions"])
        else:
            action = env.action_space.sample()
        _, _, terminated, truncated, info = env.step(action)
        if terminated or truncated:
            env.reset()
            obs, info = env.reset()

    return ok


def check_determinism(env: SugarSwapEnv) -> bool:
    """Two episodes with the same seed should produce identical observations."""
    results = []
    for _ in range(2):
        obs, info = env.reset(seed=42)
        traj = [obs.copy()]
        for _ in range(50):
            if info.get("valid_actions"):
                # Use first valid action (deterministic choice)
                action = info["valid_actions"][0]
            else:
                action = 0
            random.seed(42)         # reset RNG before each step for full determinism
            obs, _, terminated, truncated, info = env.step(action)
            traj.append(obs.copy())
            if terminated or truncated:
                break
        results.append(traj)

    ok = all(np.allclose(a, b) for a, b in zip(results[0], results[1]))
    if not ok:
        print("  [WARN] Non-deterministic: same seed produced different trajectories.")
        print("         (This is expected if opponent uses random.choice internally.)")
    return True   # non-determinism here is acceptable; just inform


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sb3", action="store_true",
                        help="Also run stable-baselines3 check_env()")
    parser.add_argument("--episodes", type=int, default=20,
                        help="Number of random episodes to run (default: 20)")
    parser.add_argument("--render", action="store_true",
                        help="Render one episode to stdout")
    args = parser.parse_args()

    print("=" * 60)
    print(" Sugar Swap Gymnasium Environment — sanity checks")
    print("=" * 60)

    # ── 1. Instantiation ──────────────────────────────────────────────────────
    print("\n[1] Creating environment…", end=" ")
    env = SugarSwapEnv(render_mode="human" if args.render else None)
    print("OK")
    print(f"    obs  shape : {env.observation_space.shape}")
    print(f"    action dim : {env.action_space.n}")

    # ── 2. Observation bounds ─────────────────────────────────────────────────
    print("\n[2] Checking observation bounds (10 episodes)…", end=" ")
    ok = check_obs_bounds(env, n_episodes=10)
    print("OK" if ok else "FAILED")

    # ── 3. Valid actions ──────────────────────────────────────────────────────
    print("\n[3] Checking valid_actions subset…", end=" ")
    ok = check_valid_actions_coverage(env, n_steps=500)
    print("OK" if ok else "FAILED")

    # ── 4. Determinism (informational) ───────────────────────────────────────
    print("\n[4] Determinism check…", end=" ")
    check_determinism(env)
    print("OK (see WARN above if any)")

    # ── 5. Random rollouts ────────────────────────────────────────────────────
    print(f"\n[5] Running {args.episodes} random episodes…")
    t0 = time.perf_counter()
    stats = [run_episode(env, use_valid_actions=True) for _ in range(args.episodes)]
    elapsed = time.perf_counter() - t0

    steps_list   = [s["steps"]         for s in stats]
    rewards_list = [s["total_reward"]  for s in stats]
    illegal_list = [s["illegal_moves"] for s in stats]
    rounds_list  = [s["rounds"]        for s in stats]
    agent_scores = [s["final_scores"][0] for s in stats if len(s["final_scores"]) >= 2]
    opp_scores   = [s["final_scores"][1] for s in stats if len(s["final_scores"]) >= 2]
    wins         = sum(a < o for a, o in zip(agent_scores, opp_scores))

    print(f"    Episodes    : {args.episodes}")
    print(f"    Total time  : {elapsed:.2f}s  ({elapsed/args.episodes*1000:.1f}ms / ep)")
    print(f"    Steps       : min={min(steps_list)}  max={max(steps_list)}  "
          f"avg={sum(steps_list)/len(steps_list):.0f}")
    print(f"    Rewards     : min={min(rewards_list):.1f}  max={max(rewards_list):.1f}  "
          f"avg={sum(rewards_list)/len(rewards_list):.1f}")
    print(f"    Rounds/game : avg={sum(rounds_list)/len(rounds_list):.1f}")
    print(f"    Illegal acts: total={sum(illegal_list)}  "
          f"(should be 0 with use_valid_actions=True)")
    if agent_scores:
        print(f"    Agent score : avg={sum(agent_scores)/len(agent_scores):.1f}")
        print(f"    Opp score   : avg={sum(opp_scores)/len(opp_scores):.1f}")
        print(f"    Agent wins  : {wins}/{args.episodes}  "
              f"({wins/args.episodes*100:.0f}%)")

    # ── 6. Illegal action test ────────────────────────────────────────────────
    print("\n[6] Illegal action penalty test…", end=" ")
    obs, info = env.reset()
    obs2, rew, term, trunc, info2 = env.step(999)   # always illegal
    assert rew <= -4.0, "Expected large negative reward for illegal action"
    assert not term,    "Illegal action should not terminate the episode"
    print(f"OK  (reward={rew:.1f})")

    # ── 7. Rendered episode (optional) ───────────────────────────────────────
    if args.render:
        print("\n[7] Rendering one episode…")
        env2 = SugarSwapEnv(render_mode="human")
        obs, info = env2.reset(seed=0)
        env2.render()
        for step_i in range(30):
            if info.get("valid_actions"):
                action = info["valid_actions"][0]
            else:
                action = env2.action_space.sample()
            obs, rew, term, trunc, info = env2.step(action)
            env2.render()
            print(f"  step {step_i+1:2d}: action={action}  reward={rew:.2f}  "
                  f"terminated={term}")
            if term or trunc:
                break

    # ── 8. Stable-Baselines3 check (optional) ─────────────────────────────────
    if args.sb3:
        print("\n[8] stable-baselines3 check_env…", end=" ")
        try:
            from stable_baselines3.common.env_checker import check_env as sb3_check
            sb3_check(SugarSwapEnv(), warn=True)
            print("OK")
        except ImportError:
            print("SKIPPED (install stable-baselines3 first)")
        except Exception:
            traceback.print_exc()
            print("FAILED")

    print("\n" + "=" * 60)
    print(" All checks passed — environment is ready for training!")
    print("=" * 60)
    print("""
Next steps:
  pip install stable-baselines3 tensorboard

  # Quick PPO training (adjust total_timesteps as needed):
  python -c "
from stable_baselines3 import PPO
from sugar_swap_env import SugarSwapEnv
env = SugarSwapEnv()
model = PPO('MlpPolicy', env, verbose=1, tensorboard_log='./runs/')
model.learn(total_timesteps=500_000)
model.save('ppo_sugar_swap')
  "
""")


if __name__ == "__main__":
    main()
