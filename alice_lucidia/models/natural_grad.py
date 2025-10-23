"""Simple natural-gradient style optimiser for Lucidia training."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Iterable, Optional

import torch
from torch import Tensor
from torch.optim import Optimizer


@dataclass
class NaturalGradientConfig:
    """Hyper-parameters for the natural gradient optimiser."""

    base_lr: float = 1e-3
    damping: float = 1e-3
    momentum: float = 0.9


class NaturalGradientOptimizer(Optimizer):
    """A lightweight optimiser that keeps a diagonal Fisher estimate."""

    def __init__(self, params: Iterable[Tensor], config: NaturalGradientConfig) -> None:
        defaults = dict(lr=config.base_lr, damping=config.damping, momentum=config.momentum)
        super().__init__(params, defaults)
        self.config = config

    @torch.no_grad()
    def step(self, closure: Optional[Callable[[], Tensor]] = None) -> Optional[Tensor]:
        loss: Optional[Tensor] = None
        if closure is not None:
            with torch.enable_grad():
                loss = closure()

        for group in self.param_groups:
            lr = group["lr"]
            damping = group["damping"]
            momentum = group["momentum"]
            for param in group["params"]:
                if param.grad is None:
                    continue
                grad = param.grad.detach()
                state = self.state[param]
                fisher = state.get("fisher")
                if fisher is None:
                    fisher = torch.zeros_like(grad)
                fisher.mul_(momentum).addcmul_(grad, grad, value=1 - momentum)
                preconditioner = grad / (fisher + damping)
                param.add_(preconditioner, alpha=-lr)
                state["fisher"] = fisher
        return loss


__all__ = ["NaturalGradientConfig", "NaturalGradientOptimizer"]
