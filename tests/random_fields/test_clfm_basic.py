"""Basic tests for the CLFM components."""

from __future__ import annotations

import pytest

torch = pytest.importorskip("torch", reason="Install torch or ask codex for help")

from lucidia.modules.random_fields.clfm_engine import CLFMEngine, TrainConfig
from lucidia.modules.random_fields.constraints import MeanConstraint
from lucidia.modules.random_fields.datasets.synthetic_gp import SyntheticGPDataset
from lucidia.modules.random_fields.functional_vae import FunctionalVAE


def test_end_to_end_training_and_sampling() -> None:
    ds = SyntheticGPDataset(n_samples=32, n_points=16, seed=1)
    vae = FunctionalVAE(x_dim=16, z_dim=4, coord_dim=1)
    engine = CLFMEngine(vae)
    mean_const = MeanConstraint(lambda c: torch.zeros_like(c))

    engine.pretrain_vae(ds, constraints=(mean_const,), config=TrainConfig(epochs=1))
    engine.train_flow(ds, config=TrainConfig(epochs=1))

    coords = ds.coords
    fields = engine.sample(coords, n_samples=2, steps=5)
    assert fields.shape == (2, 16)
    res = mean_const.residual(fields, coords)
    assert torch.isfinite(res)
