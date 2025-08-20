"""Domain grids and collocation utilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import torch


@dataclass
class Grid1D:
    start: float = 0.0
    end: float = 1.0
    num: int = 128

    def linspace(self, device: torch.device) -> torch.Tensor:
        return torch.linspace(self.start, self.end, self.num, device=device).view(-1, 1)

    def sample(self, n: int, device: torch.device) -> torch.Tensor:
        return torch.rand(n, 1, device=device) * (self.end - self.start) + self.start


__all__ = ["Grid1D"]
