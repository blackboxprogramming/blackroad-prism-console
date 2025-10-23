"""Optimal transport utilities for Lucidia's simulation tools."""
from __future__ import annotations

from dataclasses import dataclass

import torch
from torch import Tensor


@dataclass
class BridgeConfig:
    """Configuration controlling the Schrödinger bridge interpolation."""

    steps: int = 4
    epsilon: float = 1e-2
    alpha: float = 0.5


def sinkhorn_transport(
    p: Tensor,
    q: Tensor,
    cost: Tensor,
    epsilon: float = 1e-1,
    max_iters: int = 100,
    tol: float = 1e-6,
) -> tuple[Tensor, tuple[Tensor, Tensor]]:
    """Compute an entropic OT plan via Sinkhorn iterations."""

    if p.dim() != 1 or q.dim() != 1:
        raise ValueError("p and q must be 1D tensors")
    if cost.shape != (p.shape[0], q.shape[0]):
        raise ValueError("cost matrix shape must match marginals")
    kernel = torch.exp(-cost / max(epsilon, 1e-6))
    u = torch.ones_like(p)
    v = torch.ones_like(q)
    for _ in range(max_iters):
        u_prev = u
        Kv = kernel @ v + 1e-12
        u = p / Kv
        Ku = kernel.t() @ u + 1e-12
        v = q / Ku
        if torch.max(torch.abs(u - u_prev)) < tol:
            break
    plan = torch.einsum("i,ij,j->ij", u, kernel, v)
    total = plan.sum()
    if total > 0:
        plan = plan / total
    return plan, (u, v)


def schrodinger_bridge(prior: Tensor, target: Tensor, config: BridgeConfig) -> Tensor:
    """Construct a smooth path from ``prior`` to ``target`` using OT heuristics."""

    if prior.shape != target.shape:
        raise ValueError("prior and target must have matching shapes")
    if config.steps < 1:
        raise ValueError("steps must be positive")
    device = prior.device
    dtype = prior.dtype
    schedule = torch.linspace(0.0, 1.0, config.steps + 2, device=device, dtype=dtype)
    path = []
    for tau in schedule:
        intermediate = torch.lerp(prior, target, tau)
        if 0.0 < tau < 1.0 and config.alpha > 0:
            mean = intermediate.mean(dim=-1, keepdim=True)
            intermediate = (1 - config.alpha) * intermediate + config.alpha * mean
        if config.epsilon > 0:
            smoothing = config.epsilon * (1 - tau) * tau * (target - prior)
            intermediate = intermediate + smoothing
        path.append(intermediate)
    return torch.stack(path, dim=0)


__all__ = ["BridgeConfig", "schrodinger_bridge", "sinkhorn_transport"]
