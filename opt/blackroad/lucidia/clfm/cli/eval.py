"""Evaluation utilities for c-LFM."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import torch

from ..data.datasets import GaussianProcessDataset, GPDatasetConfig
from ..core.grid import Grid1D
from ..core.losses import stats_residual

DEFAULT_OUT = Path("opt/blackroad/lucidia/artifacts")


def evaluate(cfg: Optional[dict] = None) -> dict:
    cfg = cfg or {}
    out_dir = Path(cfg.get("out_dir", DEFAULT_OUT))
    samples = torch.load(out_dir / "samples.pt")

    grid = Grid1D()
    ds = GaussianProcessDataset(GPDatasetConfig(grid=grid))
    x, y = ds[0]
    mse = torch.mean((samples[0] - y) ** 2).item()
    cov_target = torch.cov(y.squeeze().T)
    cov_res = stats_residual(samples, cov_target).item()
    report = {"mse": mse, "cov_residual": cov_res}
    with open(out_dir / "report.json", "w") as f:
        json.dump(report, f)
    return report


if __name__ == "__main__":  # pragma: no cover
    evaluate()
