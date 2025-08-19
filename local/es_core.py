"""Core utilities for Evolution Strategies."""
from __future__ import annotations

import gymnasium as gym
import torch
from torch import nn
from typing import Tuple

from .models import unflatten_params


def perturb(params: torch.Tensor, noise: torch.Tensor, sigma: float) -> Tuple[torch.Tensor, torch.Tensor]:
    """Return positive and negative perturbations of parameters."""
    return params + sigma * noise, params - sigma * noise


def evaluate(env_name: str, model: nn.Module, params: torch.Tensor, episodes: int = 1, seed: int | None = None) -> float:
    """Evaluate a policy with given parameters and return average reward."""
    unflatten_params(model, params)
    env = gym.make(env_name)
    total_reward = 0.0
    for ep in range(episodes):
        obs, _ = env.reset(seed=None if seed is None else seed + ep)
        done = False
        while not done:
            obs_t = torch.as_tensor(obs, dtype=torch.float32)
            action = model.act(obs_t)
            obs, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            total_reward += reward
    env.close()
    return total_reward / episodes


def estimate_gradient(noises: torch.Tensor, rewards_pos: torch.Tensor, rewards_neg: torch.Tensor, sigma: float) -> torch.Tensor:
    """Estimate gradient using antithetic sampling."""
    advantages = rewards_pos - rewards_neg
    grad = (advantages.unsqueeze(1) * noises).mean(0) / sigma
    return grad


def update(params: torch.Tensor, grad: torch.Tensor, lr: float, weight_decay: float) -> torch.Tensor:
    """Apply gradient ascent step with weight decay."""
    return params + lr * (grad - weight_decay * params)


__all__ = ["perturb", "evaluate", "estimate_gradient", "update"]
