"""Functional variational autoencoder with DeepONet decoder."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional, Tuple

import torch
from torch import nn

from .deeponet import BranchNet, BranchNetConfig, TrunkNet, TrunkNetConfig
from . import losses


@dataclass
class EncoderConfig:
    in_dim: int
    latent_dim: int
    width: int = 64
    depth: int = 2


class Encoder(nn.Module):
    def __init__(self, cfg: EncoderConfig):
        super().__init__()
        layers = []
        dim = cfg.in_dim
        for _ in range(cfg.depth):
            layers.append(nn.Linear(dim, cfg.width))
            layers.append(nn.Tanh())
            dim = cfg.width
        self.mean = nn.Linear(dim, cfg.latent_dim)
        self.logvar = nn.Linear(dim, cfg.latent_dim)
        self.net = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h = self.net(x)
        return self.mean(h), self.logvar(h)


@dataclass
class VAEConfig:
    encoder: EncoderConfig
    branch: BranchNetConfig
    trunk: TrunkNetConfig


class FunctionalVAE(nn.Module):
    """Variational autoencoder whose decoder represents a function."""

    def __init__(self, cfg: VAEConfig):
        super().__init__()
        self.encoder = Encoder(cfg.encoder)
        self.branch = BranchNet(cfg.branch)
        self.trunk = TrunkNet(cfg.trunk)

    def encode(self, y: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        return self.encoder(y)

    def reparameterize(self, mean: torch.Tensor, logvar: torch.Tensor) -> torch.Tensor:
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mean + eps * std

    def decode(self, z: torch.Tensor, x: torch.Tensor) -> torch.Tensor:
        b = self.branch(z)
        t = self.trunk(x)
        return (b * t).sum(-1, keepdim=True)

    def forward(self, x: torch.Tensor, y: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        mean, logvar = self.encode(y)
        z = self.reparameterize(mean, logvar)
        recon = self.decode(z, x)
        kl = losses.kl_loss(mean, logvar)
        return recon, kl, z


__all__ = ["FunctionalVAE", "VAEConfig", "EncoderConfig"]
