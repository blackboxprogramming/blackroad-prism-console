"""Agent tool implementations for retrieval, generation, and simulation."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import torch
from torch import Tensor

from ..memory.store import MemoryStore
from ..models.encoders import EncoderConfig, GeneratorConfig, TextEncoder, TextGenerator
from ..models.ot import BridgeConfig, schrodinger_bridge


@dataclass
class RetrievalResult:
    text: str
    metadata: Dict[str, str]


class RetrievalTool:
    def __init__(self, store: MemoryStore, encoder: TextEncoder) -> None:
        self.store = store
        self.encoder = encoder

    def __call__(self, query: str, k: int = 5) -> List[RetrievalResult]:
        embedding = self.encoder.encode([query])[0]
        entries = self.store.read(embedding, k=k)
        return [RetrievalResult(text=entry.value, metadata=entry.metadata) for entry in entries]


class GenerationTool:
    def __init__(self, generator: TextGenerator) -> None:
        self.generator = generator

    def __call__(self, prompt: str, steer: Tensor | None = None) -> str:
        return self.generator.generate(prompt, steering_vector=steer)


class SimulationTool:
    """Uses Lucidia's latent model to perform what-if rollouts."""

    def __init__(self, bridge_config: BridgeConfig) -> None:
        self.config = bridge_config

    def __call__(self, prior: Tensor, target: Tensor) -> Tensor:
        return schrodinger_bridge(prior, target, self.config)


def build_default_tools(store: MemoryStore) -> Dict[str, object]:
    encoder = TextEncoder(EncoderConfig())
    generator = TextGenerator(GeneratorConfig())
    return {
        "retrieve": RetrievalTool(store, encoder),
        "generate": GenerationTool(generator),
        "simulate": SimulationTool(BridgeConfig()),
    }


__all__ = [
    "RetrievalTool",
    "GenerationTool",
    "SimulationTool",
    "build_default_tools",
    "RetrievalResult",
]
