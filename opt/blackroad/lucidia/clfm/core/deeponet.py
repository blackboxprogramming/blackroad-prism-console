"""Simple DeepONet style components used by the functional decoder.

The BranchNet consumes latent variables while the TrunkNet consumes
continuous coordinates.  Outputs of the two networks are combined via a
dot product to produce field values.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

import torch
from torch import nn


def _mlp(in_dim: int, hidden: int, depth: int, out_dim: int) -> nn.Sequential:
    layers = []
    dim = in_dim
    for _ in range(depth):
        layers.append(nn.Linear(dim, hidden))
        layers.append(nn.Tanh())
        dim = hidden
    layers.append(nn.Linear(dim, out_dim))
    return nn.Sequential(*layers)


@dataclass
class BranchNetConfig:
    latent_dim: int
    width: int = 64
    depth: int = 2
    out_dim: int = 64


@dataclass
class TrunkNetConfig:
    coord_dim: int
    width: int = 64
    depth: int = 2
    out_dim: int = 64
    pos_enc: Optional[Callable[[torch.Tensor], torch.Tensor]] = None


class BranchNet(nn.Module):
    """Processes latent variables into branch features."""

    def __init__(self, cfg: BranchNetConfig):
        super().__init__()
        self.net = _mlp(cfg.latent_dim, cfg.width, cfg.depth, cfg.out_dim)

    def forward(self, z: torch.Tensor) -> torch.Tensor:  # pragma: no cover - tiny wrapper
        return self.net(z)


class TrunkNet(nn.Module):
    """Processes spatial/temporal coordinates into trunk features."""

    def __init__(self, cfg: TrunkNetConfig):
        super().__init__()
        in_dim = cfg.coord_dim
        self.pos_enc = cfg.pos_enc
        if self.pos_enc is not None:
            dummy = torch.zeros(1, cfg.coord_dim)
            in_dim = self.pos_enc(dummy).shape[-1]
        self.net = _mlp(in_dim, cfg.width, cfg.depth, cfg.out_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.pos_enc is not None:
            x = self.pos_enc(x)
        return self.net(x)


__all__ = [
    "BranchNet",
    "BranchNetConfig",
    "TrunkNet",
    "TrunkNetConfig",
]
