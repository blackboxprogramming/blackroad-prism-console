"""Lucidia world-model and memory agent."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import torch
from torch import Tensor

from ..memory.store import MemoryStore
from ..models.encoders import EncoderConfig, TextEncoder
from ..models.hopfield import HopfieldConfig, ModernHopfieldHead
from ..models.world_model import LatentWorldModel, WorldModelConfig


@dataclass
class LucidiaConfig:
    memory_path: str = "./memory/lucidia_store.json"
    encoder_model: str = "distilbert-base-uncased"
    hopfield_beta: float = 20.0
    hopfield_projection: int = 64
    hopfield_memory: int = 256


class LucidiaAgent:
    """Encapsulates the hybrid memory and latent dynamics used by Alice."""

    def __init__(self, config: LucidiaConfig) -> None:
        self.config = config
        self.encoder = TextEncoder(EncoderConfig(model_name=config.encoder_model))
        self.store = MemoryStore(self.encoder.embedding_dim, Path(config.memory_path))
        hopfield_config = HopfieldConfig(
            beta=config.hopfield_beta,
            projection_dim=config.hopfield_projection,
            memory_size=config.hopfield_memory,
        )
        self.hopfield = ModernHopfieldHead(hopfield_config, input_dim=self.encoder.embedding_dim)
        self.world_model = LatentWorldModel(WorldModelConfig(input_dim=self.encoder.embedding_dim))

    def encode(self, text: str) -> Tensor:
        return self.encoder.encode([text])[0]

    def write_fact(self, key: str, text: str, metadata: Dict[str, str] | None = None) -> None:
        metadata = metadata or {}
        vector = self.encode(text)
        self.store.write(key, vector, text, metadata)

    def recall(self, query: str, k: int = 5) -> List[str]:
        vector = self.encode(query)
        entries = self.store.read(vector, k=k)
        if not entries:
            return []
        candidate_vectors = torch.stack([torch.from_numpy(entry.vector) for entry in entries])
        weights, _ = self.hopfield(vector.unsqueeze(0), candidate_vectors.unsqueeze(0))
        ranked = sorted(zip(weights[0], entries), key=lambda item: item[0], reverse=True)
        return [entry.value for _, entry in ranked]

    def simulate_transition(self, text_sequence: List[str]) -> Tensor:
        embeddings = torch.stack([self.encode(text) for text in text_sequence])
        reconstruction, next_state, reg = self.world_model(embeddings.unsqueeze(0))
        kl = self.world_model.fokker_planck_regularizer(embeddings.mean(dim=0), next_state)
        return reconstruction.mean() + reg + kl


__all__ = ["LucidiaAgent", "LucidiaConfig"]
