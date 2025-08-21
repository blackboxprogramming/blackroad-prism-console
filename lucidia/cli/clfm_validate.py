"""Validate constraint satisfaction for a trained CLFM model."""

from __future__ import annotations

import argparse

import torch

from lucidia.modules.random_fields.clfm_engine import CLFMEngine
from lucidia.modules.random_fields.constraints import MeanConstraint
from lucidia.modules.random_fields.datasets.synthetic_gp import SyntheticGPDataset
from lucidia.modules.random_fields.functional_vae import FunctionalVAE


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate CLFM constraints")
    parser.add_argument("--samples", type=int, default=10)
    args = parser.parse_args()

    ds = SyntheticGPDataset(n_samples=64, n_points=32)
    coords = ds.coords
    vae = FunctionalVAE(x_dim=32, z_dim=8, coord_dim=1)
    engine = CLFMEngine(vae)
    mean_const = MeanConstraint(lambda c: torch.zeros_like(c))
    engine.pretrain_vae(ds, constraints=(mean_const,))
    fields = engine.sample(coords, n_samples=args.samples)
    mean_res = mean_const.residual(fields, coords)
    print({"mean_residual": float(mean_res)})


if __name__ == "__main__":  # pragma: no cover
    main()
