# mypy: ignore-errors
"""Model definitions for local ES training."""

from __future__ import annotations

import torch
from torch import nn, Tensor


class MLPPolicy(nn.Module):
    """Simple MLP policy network."""
"""Models for local ES experiments."""
from __future__ import annotations


import torch
from torch import nn


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
    """Apply noise to parameter vector."""
    return params + sigma * noise
    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        return self.net(obs)

    def act(self, obs: torch.Tensor) -> int:
        with torch.no_grad():
            logits = self.forward(obs)
            return int(torch.argmax(logits).item())


def flatten_params(model: nn.Module) -> torch.Tensor:
    """Flatten model parameters into a single 1-D tensor."""
    return torch.cat([p.detach().view(-1) for p in model.parameters()])


def unflatten_params(model: nn.Module, flat: torch.Tensor) -> None:
    """Load parameters from a flat tensor back into the model."""
    pointer = 0
    for p in model.parameters():
        numel = p.numel()
        p.data.copy_(flat[pointer:pointer + numel].view_as(p))
        pointer += numel


__all__ = ["MLPPolicy", "flatten_params", "unflatten_params"]
