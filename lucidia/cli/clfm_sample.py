"""Sample fields from a trained CLFM model."""

from __future__ import annotations

import argparse

import torch

from lucidia.modules.random_fields.clfm_engine import CLFMEngine
from lucidia.modules.random_fields.functional_vae import FunctionalVAE
from lucidia.modules.random_fields.datasets.synthetic_gp import SyntheticGPDataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Sample from trained model")
    parser.add_argument("--samples", type=int, default=1)
    args = parser.parse_args()

    ds = SyntheticGPDataset(n_samples=1, n_points=32)
    coords = ds.coords
    vae = FunctionalVAE(x_dim=32, z_dim=8, coord_dim=1)
    engine = CLFMEngine(vae)
    fields = engine.sample(coords, n_samples=args.samples)
    print(fields)


if __name__ == "__main__":  # pragma: no cover
    main()
