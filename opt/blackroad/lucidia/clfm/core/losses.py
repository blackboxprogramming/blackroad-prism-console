"""Loss utilities for c-LFM."""

from __future__ import annotations

import torch
from torch import nn


def reconstruction_loss(pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    return nn.functional.mse_loss(pred, target)


def kl_loss(mean: torch.Tensor, logvar: torch.Tensor) -> torch.Tensor:
    return -0.5 * torch.mean(1 + logvar - mean.pow(2) - logvar.exp())


def stats_residual(samples: torch.Tensor, target_cov: torch.Tensor) -> torch.Tensor:
    """Match empirical covariance of samples to target covariance."""
    if samples.ndim == 3:
        # (batch, points, 1)
        samples = samples.squeeze(-1)
    cov = torch.cov(samples.T)
    return nn.functional.mse_loss(cov, target_cov)


def physics_residual(u: torch.Tensor, operator: callable) -> torch.Tensor:
    """Evaluate physics residual via provided operator."""
    res = operator(u)
    return torch.mean(res ** 2)


__all__ = [
    "reconstruction_loss",
    "kl_loss",
    "stats_residual",
    "physics_residual",
]
