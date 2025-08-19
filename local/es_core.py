# mypy: ignore-errors
"""Core Evolution Strategies utilities for local training."""

from __future__ import annotations

import torch
from torch import Tensor


def evaluate(env, model, params: Tensor, episodes: int, seed: int) -> float:
    """Evaluate a policy with given parameters and return mean reward."""
    from .models import vector_to_params

    vector_to_params(params, model)
    total_reward = 0.0
    for ep in range(episodes):
        obs, _ = env.reset(seed=seed + ep)
        done = False
        while not done:
            obs_t = torch.as_tensor(obs, dtype=torch.float32)
            logits = model(obs_t)
            action = int(torch.argmax(logits).item())
            obs, reward, terminated, truncated, _ = env.step(action)
            total_reward += reward
            done = terminated or truncated
    return total_reward / episodes


def sample_noise(generator: torch.Generator, size: int) -> Tensor:
    """Sample Gaussian noise."""
    return torch.randn(size, generator=generator)


def estimate_gradient(
    noises: Tensor,
    rewards_pos: Tensor,
    rewards_neg: Tensor,
    sigma: float,
) -> Tensor:
    """Estimate gradient using antithetic sampling."""
    returns = rewards_pos - rewards_neg
    grad = (returns[:, None] * noises).mean(dim=0) / (2 * sigma)
    return grad


def update(params: Tensor, grad: Tensor, lr: float, weight_decay: float) -> Tensor:
    """Apply gradient update with weight decay."""
    return params + lr * grad - weight_decay * params
