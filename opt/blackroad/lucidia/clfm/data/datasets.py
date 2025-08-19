"""Synthetic datasets used for demos."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Tuple

import numpy as np
import torch
from torch.utils.data import Dataset

from ..core.grid import Grid1D


@dataclass
class GPDatasetConfig:
    grid: Grid1D
    num_sensors: int = 3
    seed: int = 0


class GaussianProcessDataset(Dataset):
    """1D GP with RBF kernel evaluated on a grid."""

    def __init__(self, cfg: GPDatasetConfig):
        self.cfg = cfg
        rng = np.random.default_rng(cfg.seed)
        x = cfg.grid.linspace(torch.device("cpu")).numpy().squeeze()
        # RBF kernel
        pairwise = np.subtract.outer(x, x)
        cov = np.exp(-0.5 * pairwise ** 2 / 0.2**2)
        self.samples = rng.multivariate_normal(np.zeros_like(x), cov, size=128)
        self.x = x

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        u = torch.from_numpy(self.samples[idx]).float().view(-1, 1)
        return torch.from_numpy(self.x).float().view(-1, 1), u


@dataclass
class Poisson1DConfig:
    grid: Grid1D
    seed: int = 0


class Poisson1DDataset(Dataset):
    """Simple 1D Poisson problem with random coefficient field."""

    def __init__(self, cfg: Poisson1DConfig):
        self.cfg = cfg
        rng = np.random.default_rng(cfg.seed)
        x = cfg.grid.linspace(torch.device("cpu")).numpy().squeeze()
        n = len(x)
        coeff = rng.normal(1.0, 0.1, size=n)
        # Discrete Laplace operator with Dirichlet BC u(0)=u(1)=0
        A = np.zeros((n, n))
        h = x[1] - x[0]
        for i in range(1, n - 1):
            A[i, i - 1] = coeff[i]
            A[i, i] = -2 * coeff[i]
            A[i, i + 1] = coeff[i]
        f = np.ones(n)
        f[0] = f[-1] = 0
        u = np.linalg.solve(A[1:-1, 1:-1], f[1:-1])
        u = np.concatenate([[0.0], u, [0.0]])
        self.x = x
        self.u = u

    def __len__(self) -> int:
        return 1

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        return torch.from_numpy(self.x).float().view(-1, 1), torch.from_numpy(self.u).float().view(-1, 1)


__all__ = [
    "GaussianProcessDataset",
    "GPDatasetConfig",
    "Poisson1DDataset",
    "Poisson1DConfig",
]
