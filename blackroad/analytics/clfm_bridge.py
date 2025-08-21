"""Utilities for applying CLFM to BlackRoad analytics data."""

from __future__ import annotations

import pandas as pd
import torch

from lucidia.modules.random_fields.clfm_engine import CLFMEngine
from lucidia.modules.random_fields.functional_vae import FunctionalVAE


def dataframe_to_field(df: pd.DataFrame) -> tuple[torch.Tensor, torch.Tensor]:
    """Convert a one‑column DataFrame to ``(values, coords)`` tensors."""

    if df.shape[1] != 1:
        raise ValueError("dataframe must have a single column")
    values = torch.tensor(df.iloc[:, 0].to_numpy(), dtype=torch.float32)
    coords = torch.linspace(0, 1, len(df)).unsqueeze(-1)
    return values, coords


def impute_missing(df: pd.DataFrame) -> pd.Series:
    """Run a dummy CLFM sampler to produce an imputed series.

    This is a minimal placeholder implementation.  In a real deployment the
    engine would be pre‑trained and loaded from disk.
    """

    values, coords = dataframe_to_field(df.fillna(0.0))
    vae = FunctionalVAE(x_dim=len(values), z_dim=4, coord_dim=1)
    engine = CLFMEngine(vae)
    samples = engine.sample(coords, n_samples=1)
    return pd.Series(samples.squeeze().numpy(), index=df.index)


__all__ = ["dataframe_to_field", "impute_missing"]
