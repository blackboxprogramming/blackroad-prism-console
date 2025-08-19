"""CLI for training the CLFM engine on a synthetic dataset."""

from __future__ import annotations

import argparse

import torch

from lucidia.modules.random_fields.clfm_engine import CLFMEngine, TrainConfig
from lucidia.modules.random_fields.constraints import MeanConstraint
from lucidia.modules.random_fields.datasets.synthetic_gp import SyntheticGPDataset
from lucidia.modules.random_fields.functional_vae import FunctionalVAE


def main() -> None:
    parser = argparse.ArgumentParser(description="Train C-LFM on synthetic data")
    parser.add_argument("--epochs", type=int, default=1)
    args = parser.parse_args()

    ds = SyntheticGPDataset(n_samples=64, n_points=32)
    vae = FunctionalVAE(x_dim=32, z_dim=8, coord_dim=1)
    engine = CLFMEngine(vae)
    mean_const = MeanConstraint(lambda c: torch.zeros_like(c))
    engine.pretrain_vae(ds, constraints=(mean_const,), config=TrainConfig(epochs=args.epochs))
    engine.train_flow(ds, config=TrainConfig(epochs=args.epochs))
    print("training complete")


if __name__ == "__main__":  # pragma: no cover - CLI entry
    main()
