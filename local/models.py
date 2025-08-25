from __future__ import annotations

"""Lightweight models and utilities for local ES experiments."""

import torch
from torch import nn, Tensor


class MLPPolicy(nn.Module):
    """Simple MLP policy producing action logits."""

    def __init__(self, obs_dim: int, act_dim: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, 64),
            nn.Tanh(),
            nn.Linear(64, 64),
            nn.Tanh(),
            nn.Linear(64, act_dim),
        )

    def forward(self, obs: Tensor) -> Tensor:
        return self.net(obs)


def params_to_vector(model: nn.Module) -> Tensor:
    """Flatten model parameters to a 1D tensor."""

    return torch.nn.utils.parameters_to_vector(model.parameters())


def vector_to_params(vec: Tensor, model: nn.Module) -> None:
    """Load a 1D tensor into a model's parameters."""

    torch.nn.utils.vector_to_parameters(vec, model.parameters())


def num_params(model: nn.Module) -> int:
    """Return number of parameters in the model."""

    return sum(p.numel() for p in model.parameters())


def perturb_params(params: Tensor, noise: Tensor, sigma: float) -> Tensor:
    """Apply noise to a parameter vector."""

    return params + sigma * noise


def flatten_params(model: nn.Module) -> Tensor:
    """Flatten model parameters into a single 1‑D tensor."""

    return torch.cat([p.detach().view(-1) for p in model.parameters()])


def unflatten_params(model: nn.Module, flat: Tensor) -> None:
    """Load parameters from a flat tensor back into the model."""

    pointer = 0
    for p in model.parameters():
        numel = p.numel()
        p.data.copy_(flat[pointer : pointer + numel].view_as(p))
        pointer += numel


__all__ = [
    "MLPPolicy",
    "params_to_vector",
    "vector_to_params",
    "num_params",
    "perturb_params",
    "flatten_params",
    "unflatten_params",
]
