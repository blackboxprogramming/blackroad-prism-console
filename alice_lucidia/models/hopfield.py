"""Modern Hopfield-style attention head used for Lucidia's memory."""
from __future__ import annotations

import math
from dataclasses import dataclass

import torch
from torch import Tensor, nn


@dataclass
class HopfieldConfig:
    """Configuration for the Hopfield retrieval head."""

    beta: float = 10.0
    projection_dim: int = 64
    memory_size: int = 256


class ModernHopfieldHead(nn.Module):
    """Implements a differentiable Hopfield-style associative memory."""

    def __init__(self, config: HopfieldConfig, input_dim: int) -> None:
        super().__init__()
        self.config = config
        self.query_proj = nn.Linear(input_dim, config.projection_dim, bias=False)
        self.key_proj = nn.Linear(input_dim, config.projection_dim, bias=False)
        nn.init.orthogonal_(self.query_proj.weight)
        nn.init.orthogonal_(self.key_proj.weight)

    def forward(self, query: Tensor, candidates: Tensor) -> tuple[Tensor, Tensor]:
        """Return attention-weighted memory readout and energy."""

        if candidates.dim() != 3:
            raise ValueError("candidates must be of shape (batch, memory, dim)")
        if query.dim() != 2:
            raise ValueError("query must be of shape (batch, dim)")
        proj_query = self.query_proj(query)
        proj_memory = self.key_proj(candidates)
        scale = math.sqrt(self.config.projection_dim)
        scores = torch.einsum("bd,bmd->bm", proj_query, proj_memory) / scale
        weights = torch.softmax(self.config.beta * scores, dim=-1)
        readout = torch.einsum("bm,bmd->bd", weights, candidates)
        shift = scores.max(dim=-1, keepdim=True).values
        stabilised = self.config.beta * (scores - shift)
        logsum = torch.logsumexp(stabilised, dim=-1)
        energy = -(shift.squeeze(-1) + logsum / max(self.config.beta, 1e-6))
        return readout, energy

    def gated_write(self, memory: Tensor, new_value: Tensor, gate: Tensor) -> Tensor:
        """Blend ``new_value`` into ``memory`` according to ``gate`` weights."""

        if gate.dim() == 1:
            gate = gate.unsqueeze(-1)
        gate = gate.clamp(0.0, 1.0)
        return memory + gate * (new_value - memory)


__all__ = ["HopfieldConfig", "ModernHopfieldHead"]
