"""
train.py — Sugar Swap RL training pipeline.

Curriculum en 3 phases :
  Phase 1 : Adversaire aléatoire        (apprendre les règles de base)
  Phase 2 : Adversaire greedy           (apprendre la stratégie)
  Phase 3 : Self-play                   (atteindre le niveau expert)

Utilise MaskablePPO (sb3-contrib) : n'explore jamais d'actions illégales.

Usage :
    pip install -r requirements.txt
    python train.py                  # entraînement complet (~2h sur CPU, 20min GPU)
    python train.py --phase 3        # reprendre en phase 3 uniquement
    python train.py --timesteps 2e6  # budget personnalisé par phase
"""

from __future__ import annotations

import argparse
import os

import numpy as np
from gymnasium import spaces
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.callbacks import MaskableEvalCallback
from sb3_contrib.common.maskable.utils import get_action_masks
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import SubprocVecEnv

from sugar_swap_env import SugarSwapEnv


# ─── Action-mask wrapper required by MaskablePPO ─────────────────────────────

class MaskableWrapper(SugarSwapEnv):
    """Adds action_masks() method expected by sb3-contrib's MaskablePPO."""

    def action_masks(self) -> list[bool]:
        valid = set(self._valid_actions())
        return [a in valid for a in range(self.action_space.n)]


# ─── Self-play opponent ───────────────────────────────────────────────────────

class SelfPlayEnv(MaskableWrapper):
    """
    Same env but the opponent loads the latest saved model and plays with it.
    The model file is refreshed every episode so the opponent always
    reflects the most recent checkpoint.
    """

    def __init__(self, model_path: str = "ppo_sugar_swap_selfplay", **kwargs):
        super().__init__(opponent_policy="random", **kwargs)  # fallback = random
        self._model_path = model_path
        self._opponent_model = None
        self._load_opponent()

    def _load_opponent(self) -> None:
        path = self._model_path + ".zip"
        if os.path.exists(path):
            try:
                self._opponent_model = MaskablePPO.load(path)
            except Exception:
                self._opponent_model = None

    def reset(self, **kwargs):
        self._load_opponent()   # refresh checkpoint each episode
        return super().reset(**kwargs)

    def _opponent_action(self) -> int:
        if self._opponent_model is None:
            return super()._opponent_action()   # greedy fallback

        obs = self._obs()
        masks = self.action_masks()

        # MaskablePPO.predict needs the masks
        action, _ = self._opponent_model.predict(
            obs.reshape(1, -1),
            action_masks=np.array([masks]),
            deterministic=False,
        )
        return int(action)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _make_env(opponent: str, n_envs: int = 4):
    """Create vectorised parallel environments."""
    def _factory(opp=opponent):
        if opp == "selfplay":
            return lambda: SelfPlayEnv()
        return lambda: MaskableWrapper(opponent_policy=opp)
    return make_vec_env(_factory(), n_envs=n_envs, vec_env_cls=SubprocVecEnv)


def _make_model(env, lr: float = 3e-4, ent_coef: float = 0.01) -> MaskablePPO:
    return MaskablePPO(
        "MlpPolicy",
        env,
        verbose          = 1,
        learning_rate    = lr,
        n_steps          = 2048,
        batch_size       = 256,
        n_epochs         = 10,
        gamma            = 0.99,
        gae_lambda       = 0.95,
        clip_range       = 0.2,
        ent_coef         = ent_coef,     # encourage exploration
        policy_kwargs    = dict(net_arch=[256, 256, 128]),  # bigger network
        tensorboard_log  = "./runs/",
    )


def _eval_callback(env_factory, save_path: str, freq: int = 50_000):
    eval_env = env_factory()
    return MaskableEvalCallback(
        eval_env,
        best_model_save_path = save_path,
        log_path             = save_path,
        eval_freq            = freq,
        n_eval_episodes      = 20,
        deterministic        = True,
        verbose              = 1,
    )


# ─── Training phases ─────────────────────────────────────────────────────────

def phase1_random(timesteps: int) -> None:
    """Phase 1 — apprendre les règles contre un adversaire aléatoire."""
    print("\n" + "="*60)
    print(" Phase 1 — Adversaire ALÉATOIRE")
    print("="*60)

    env   = _make_env("random", n_envs=4)
    model = _make_model(env, lr=3e-4, ent_coef=0.02)
    cb    = _eval_callback(
        lambda: MaskableWrapper(opponent_policy="random"),
        save_path="./checkpoints/phase1/",
    )
    model.learn(total_timesteps=timesteps, callback=cb, tb_log_name="phase1")
    model.save("ppo_phase1")
    print("Phase 1 terminée → ppo_phase1.zip")
    env.close()


def phase2_greedy(timesteps: int, from_phase1: bool = True) -> None:
    """Phase 2 — affiner contre un adversaire greedy."""
    print("\n" + "="*60)
    print(" Phase 2 — Adversaire GREEDY")
    print("="*60)

    env   = _make_env("greedy", n_envs=4)
    if from_phase1 and os.path.exists("ppo_phase1.zip"):
        print("  Chargement ppo_phase1.zip comme point de départ…")
        model = MaskablePPO.load("ppo_phase1", env=env)
        model.learning_rate = 1e-4   # taux réduit pour affiner
        model.ent_coef      = 0.005
    else:
        model = _make_model(env, lr=1e-4, ent_coef=0.005)

    cb = _eval_callback(
        lambda: MaskableWrapper(opponent_policy="greedy"),
        save_path="./checkpoints/phase2/",
    )
    model.learn(total_timesteps=timesteps, callback=cb, tb_log_name="phase2",
                reset_num_timesteps=False)
    model.save("ppo_phase2")
    # Initialiser le checkpoint self-play
    model.save("ppo_sugar_swap_selfplay")
    print("Phase 2 terminée → ppo_phase2.zip")
    env.close()


def phase3_selfplay(timesteps: int, save_freq: int = 100_000) -> None:
    """
    Phase 3 — Self-play : l'adversaire recharge le dernier checkpoint.
    Le modèle s'améliore en se battant contre lui-même.
    """
    print("\n" + "="*60)
    print(" Phase 3 — SELF-PLAY")
    print("="*60)

    env   = _make_env("selfplay", n_envs=2)  # moins d'envs (chargement modèle lourd)
    start = "ppo_phase2.zip" if os.path.exists("ppo_phase2.zip") else \
            "ppo_sugar_swap_selfplay.zip"

    if os.path.exists(start):
        print(f"  Chargement {start} comme point de départ…")
        model = MaskablePPO.load(start.replace(".zip", ""), env=env)
        model.learning_rate = 5e-5
        model.ent_coef      = 0.001
    else:
        model = _make_model(env, lr=5e-5, ent_coef=0.001)

    # Sauvegarder régulièrement (l'adversaire self-play recharge ce fichier)
    from stable_baselines3.common.callbacks import CheckpointCallback
    checkpoint_cb = CheckpointCallback(
        save_freq  = save_freq // 2,   # divisé par n_envs=2
        save_path  = "./checkpoints/phase3/",
        name_prefix = "selfplay",
    )

    class UpdateSelfPlayOpponent(CheckpointCallback):
        """Met à jour ppo_sugar_swap_selfplay après chaque checkpoint."""
        def _on_step(self) -> bool:
            result = super()._on_step()
            if self.n_calls % (save_freq // 2) == 0:
                self.model.save("ppo_sugar_swap_selfplay")
                print(f"  ↻ Adversaire self-play mis à jour ({self.num_timesteps} steps)")
            return result

    sp_cb = UpdateSelfPlayOpponent(
        save_freq   = save_freq // 2,
        save_path   = "./checkpoints/phase3/",
        name_prefix = "selfplay",
    )

    model.learn(
        total_timesteps    = timesteps,
        callback           = sp_cb,
        tb_log_name        = "phase3",
        reset_num_timesteps = False,
    )
    # Sauvegardes finales
    model.save("ppo_sugar_swap")           # → à exporter en ONNX
    model.save("ppo_sugar_swap_selfplay")  # → adversaire pour prochaine session
    print("\nPhase 3 terminée → ppo_sugar_swap.zip  (prêt pour export ONNX)")
    env.close()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase",     type=int,   default=0,
                        help="1=random 2=greedy 3=selfplay  0=tout (défaut)")
    parser.add_argument("--timesteps", type=float, default=1e6,
                        help="Timesteps par phase (défaut: 1 000 000)")
    args = parser.parse_args()

    ts = int(args.timesteps)
    os.makedirs("checkpoints", exist_ok=True)

    if args.phase in (0, 1): phase1_random(ts)
    if args.phase in (0, 2): phase2_greedy(ts)
    if args.phase in (0, 3): phase3_selfplay(ts)

    if args.phase == 0:
        print("\n" + "="*60)
        print(" Entraînement complet terminé !")
        print(" Exporte le modèle final :")
        print("   python export_onnx.py --test")
        print("   cp ppo_sugar_swap.onnx ../backend/src/ai/model/")
        print("="*60)


if __name__ == "__main__":
    main()
