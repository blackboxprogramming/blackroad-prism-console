"""Latent dynamics model backing the Lucidia agent."""
from __future__ import annotations

from dataclasses import dataclass

from torch import Tensor, nn


@dataclass
class WorldModelConfig:
    """Configuration for the latent world model."""

    input_dim: int
    latent_dim: int = 64
    hidden_dim: int = 128
    dropout: float = 0.0
    drift_penalty: float = 0.1


class LatentWorldModel(nn.Module):
    """A lightweight latent-variable model implemented with a GRU."""

    def __init__(self, config: WorldModelConfig) -> None:
        super().__init__()
        self.config = config
        self.encoder = nn.GRU(config.input_dim, config.hidden_dim, batch_first=True)
        self.to_latent = nn.Linear(config.hidden_dim, config.latent_dim)
        self.decoder = nn.Linear(config.latent_dim, config.input_dim)
        self.norm = nn.LayerNorm(config.latent_dim)
        self.input_projection = nn.Linear(config.input_dim, config.latent_dim)
        self.dropout = nn.Dropout(config.dropout) if config.dropout > 0 else nn.Identity()

    def forward(self, sequence: Tensor) -> tuple[Tensor, Tensor, Tensor]:
        if sequence.dim() != 3:
            raise ValueError("sequence must be (batch, steps, input_dim)")
        encoded, _ = self.encoder(sequence)
        latent = self.norm(self.to_latent(encoded))
        latent = self.dropout(latent)
        reconstruction = self.decoder(latent)
        next_state = latent[:, -1, :]
        regulariser = latent.pow(2).mean()
        return reconstruction, next_state, regulariser

    def fokker_planck_regularizer(self, current_state: Tensor, next_state: Tensor) -> Tensor:
        if current_state.dim() == 1:
            current_state = current_state.unsqueeze(0)
        projected_current = self.input_projection(current_state)
        if next_state.dim() == 1:
            next_state = next_state.unsqueeze(0)
        mismatch = next_state - projected_current
        return self.config.drift_penalty * mismatch.pow(2).mean()


__all__ = ["WorldModelConfig", "LatentWorldModel"]
