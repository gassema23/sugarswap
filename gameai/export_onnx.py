"""
export_onnx.py — Export a trained Stable-Baselines3 PPO model to ONNX.

Usage:
    python export_onnx.py                        # loads ppo_sugar_swap.zip
    python export_onnx.py --model my_model.zip   # custom path
    python export_onnx.py --test                 # also runs a quick inference test

Output:
    ppo_sugar_swap.onnx   (copy this to backend/src/ai/model/)

The exported network is the ACTOR ONLY (policy head):
    input  → obs  float32 [1, 60]
    output → action_logits  float32 [1, 27]

To pick an action at inference time:
    1. Set logits for invalid actions to -∞
    2. Apply softmax (optional — argmax on raw logits is equivalent)
    3. Pick argmax
"""

from __future__ import annotations

import argparse
import sys

import numpy as np
import torch
import torch.nn as nn


# ─── Actor wrapper ────────────────────────────────────────────────────────────

class SB3ActorExport(nn.Module):
    """
    Thin wrapper that exposes only the actor path of an SB3 PPO policy.

    SB3 policy forward pass (actor):
        features   = pi_features_extractor(obs)
        latent_pi  = mlp_extractor.policy_net(features)   ← actor MLP only
        logits     = action_net(latent_pi)
    """

    def __init__(self, policy) -> None:
        super().__init__()
        self.pi_extractor = policy.pi_features_extractor
        self.actor_mlp    = policy.mlp_extractor.policy_net
        self.action_net   = policy.action_net

    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        features  = self.pi_extractor(obs)
        latent_pi = self.actor_mlp(features)
        return self.action_net(latent_pi)          # raw logits [batch, 27]


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model",  default="ppo_sugar_swap",
                        help="Path to SB3 zip (without .zip, default: ppo_sugar_swap)")
    parser.add_argument("--output", default="ppo_sugar_swap.onnx",
                        help="Output ONNX file (default: ppo_sugar_swap.onnx)")
    parser.add_argument("--test",   action="store_true",
                        help="Run a quick onnxruntime inference test after export")
    args = parser.parse_args()

    # ── Load SB3 model ────────────────────────────────────────────────────────
    try:
        from stable_baselines3 import PPO
    except ImportError:
        print("ERROR: stable-baselines3 not installed.  pip install stable-baselines3")
        sys.exit(1)

    print(f"Loading model from '{args.model}'…")
    model  = PPO.load(args.model)
    policy = model.policy
    policy.eval()

    # ── Build export wrapper ──────────────────────────────────────────────────
    actor = SB3ActorExport(policy)
    actor.eval()

    obs_dim    = model.observation_space.shape[0]   # 60
    dummy_obs  = torch.zeros(1, obs_dim, dtype=torch.float32)

    # Smoke-test forward pass
    with torch.no_grad():
        logits = actor(dummy_obs)
    print(f"Actor output shape: {logits.shape}  (expected [1, 27])")
    assert logits.shape == (1, 27), "Unexpected logits shape — check SB3 version."

    # ── Export to ONNX ────────────────────────────────────────────────────────
    print(f"Exporting to '{args.output}'…")
    torch.onnx.export(
        actor,
        dummy_obs,
        args.output,
        input_names   = ["obs"],
        output_names  = ["action_logits"],
        dynamic_axes  = {"obs": {0: "batch"}, "action_logits": {0: "batch"}},
        opset_version = 17,
    )

    # PyTorch ≥ 2.4 sometimes writes weights to a separate .onnx.data file.
    # Re-save with all tensors inlined so a single .onnx file is produced.
    data_file = args.output + ".data"
    try:
        import onnx
        proto = onnx.load(args.output)          # loads and resolves external data
        import os
        onnx.save_model(
            proto,
            args.output,
            save_as_external_data    = False,   # inline all tensors
            all_tensors_to_one_file  = False,
        )
        if os.path.exists(data_file):
            os.remove(data_file)
            print("Merged external data into single .onnx file.")
    except ImportError:
        print("WARN: onnx library not installed — cannot merge external data.")
        if os.path.exists(data_file):
            print(f"  Copy '{data_file}' alongside the .onnx file when deploying.")

    print("Export done.")

    # ── Verify with onnxruntime ───────────────────────────────────────────────
    if args.test:
        try:
            import onnxruntime as ort
        except ImportError:
            print("WARN: onnxruntime not installed — skipping test.  pip install onnxruntime")
            return

        print("\nRunning onnxruntime inference test…")
        sess     = ort.InferenceSession(args.output)
        obs_np   = np.zeros((1, obs_dim), dtype=np.float32)
        logits_np = sess.run(["action_logits"], {"obs": obs_np})[0]
        print(f"  logits shape : {logits_np.shape}")
        print(f"  argmax action: {int(np.argmax(logits_np))}")

        # Test with action masking (only actions 15-26 valid, e.g. initial reveal)
        masked = logits_np.copy()
        valid  = list(range(15, 27))
        invalid = [a for a in range(27) if a not in valid]
        masked[0, invalid] = -1e9
        chosen = int(np.argmax(masked))
        assert chosen in valid, f"Masked argmax {chosen} not in valid set!"
        print(f"  masked action: {chosen} (valid={valid})  ✓")
        print("onnxruntime test passed.")

    print(f"\nNext step: copy '{args.output}' to backend/src/ai/model/")


if __name__ == "__main__":
    main()
