"""Latent flow matching utilities.

This is a very small implementation inspired by flow matching.  The
velocity network learns to transform standard normal noise into the
posterior latent code produced by the VAE encoder.  Integration is
performed with simple Euler or Heun steps.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Literal

import torch
from torch import nn


@dataclass
class FlowConfig:
    latent_dim: int
    hidden: int = 64
    depth: int = 2
    integrator: Literal["euler", "heun"] = "euler"


def _velocity_net(cfg: FlowConfig) -> nn.Module:
    layers = []
    dim = cfg.latent_dim + 1  # + time
    for _ in range(cfg.depth):
        layers.append(nn.Linear(dim, cfg.hidden))
        layers.append(nn.Tanh())
        dim = cfg.hidden
    layers.append(nn.Linear(dim, cfg.latent_dim))
    return nn.Sequential(*layers)


class LatentFlow(nn.Module):
    def __init__(self, cfg: FlowConfig):
        super().__init__()
        self.cfg = cfg
        self.net = _velocity_net(cfg)

    def forward(self, z: torch.Tensor, t: torch.Tensor) -> torch.Tensor:
        inp = torch.cat([z, t], -1)
        return self.net(inp)


def train_flow(flow: LatentFlow, z0: torch.Tensor, steps: int = 1000, lr: float = 1e-3) -> None:
    opt = torch.optim.Adam(flow.parameters(), lr=lr)
    for _ in range(steps):
        t = torch.rand(z0.size(0), 1, device=z0.device)
        noise = torch.randn_like(z0)
        zt = (1 - t) * z0 + t * noise
        target = z0 - noise
        pred = flow(zt, t)
        loss = ((pred - target) ** 2).mean()
        opt.zero_grad()
        loss.backward()
        opt.step()


def sample_flow(flow: LatentFlow, n: int, device: torch.device) -> torch.Tensor:
    z = torch.randn(n, flow.cfg.latent_dim, device=device)
    t0, t1 = 0.0, 1.0
    dt = (t1 - t0) / 32
    t = t0
    while t < t1:
        t_tensor = torch.full((n, 1), t, device=device)
        v = flow(z, t_tensor)
        if flow.cfg.integrator == "heun":
            z_euler = z + dt * v
            v2 = flow(z_euler, torch.full((n, 1), t + dt, device=device))
            z = z + dt * 0.5 * (v + v2)
        else:
            z = z + dt * v
        t += dt
    return z


__all__ = ["LatentFlow", "FlowConfig", "train_flow", "sample_flow"]
