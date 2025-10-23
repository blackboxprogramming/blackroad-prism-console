"""Light-weight text encoding and generation utilities for the agents."""
from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass
from typing import Sequence

import torch
from torch import Tensor, nn

_TOKEN_PATTERN = re.compile(r"\w+")


def _token_to_index(token: str, seed: int, vocab_size: int) -> int:
    data = f"{token}|{seed}".encode("utf-8")
    digest = hashlib.sha1(data).digest()
    return int.from_bytes(digest[:8], "big") % vocab_size


@dataclass
class EncoderConfig:
    """Configuration for the deterministic hash encoder."""

    model_name: str = "distilbert-base-uncased"
    embedding_dim: int = 256
    hash_vocab_size: int = 4096


class TextEncoder:
    """A tiny deterministic encoder based on hashed bag-of-words features."""

    def __init__(self, config: EncoderConfig) -> None:
        self.config = config
        self.embedding_dim = config.embedding_dim
        self._seed = int.from_bytes(hashlib.sha1(config.model_name.encode("utf-8")).digest()[:8], "big")
        generator = torch.Generator()
        generator.manual_seed(self._seed & 0xFFFFFFFF)
        self.embedding = nn.Embedding(config.hash_vocab_size, config.embedding_dim)
        with torch.no_grad():
            self.embedding.weight.normal_(mean=0.0, std=1.0 / math.sqrt(config.embedding_dim), generator=generator)

    def _token_indices(self, text: str) -> torch.LongTensor:
        tokens = _TOKEN_PATTERN.findall(text.lower())
        if not tokens:
            return torch.empty(0, dtype=torch.long)
        indices = [
            _token_to_index(token, self._seed, self.config.hash_vocab_size)
            for token in tokens
        ]
        return torch.tensor(indices, dtype=torch.long)

    def encode(self, texts: Sequence[str]) -> Tensor:
        vectors = []
        for text in texts:
            token_indices = self._token_indices(text)
            if token_indices.numel() == 0:
                vectors.append(torch.zeros(self.embedding_dim))
                continue
            embeds = self.embedding(token_indices)
            vector = embeds.mean(dim=0)
            norm = vector.norm(p=2)
            if torch.isfinite(norm) and norm > 0:
                vector = vector / norm
            vectors.append(vector)
        return torch.stack(vectors)


@dataclass
class GeneratorConfig:
    """Configuration for the light-weight text generator."""

    model_name: str = "lucidia-scribe"
    max_length: int = 64
    temperature: float = 0.8


class TextGenerator:
    """A heuristic generator that synthesises short continuations."""

    def __init__(self, config: GeneratorConfig) -> None:
        self.config = config

    def _summarise(self, prompt: str) -> str:
        tokens = _TOKEN_PATTERN.findall(prompt.lower())
        if not tokens:
            return "insight"
        unique = list(dict.fromkeys(tokens))[:5]
        return " ".join(unique)

    def generate(self, prompt: str, steering_vector: Tensor | None = None) -> str:
        prompt = prompt.strip()
        base = prompt if prompt else "Lucidia reflects"
        summary = self._summarise(base)
        tone = "balanced"
        if steering_vector is not None and steering_vector.numel() > 0:
            magnitude = float(torch.tanh(steering_vector.mean()).item())
            tone = "calm" if magnitude < 0 else "bold"
        continuation = f"{tone} insight on {summary}".strip()
        text = f"{base} -> {continuation}".strip()
        if len(text) > self.config.max_length:
            text = text[: self.config.max_length].rstrip()
        return text


__all__ = [
    "EncoderConfig",
    "TextEncoder",
    "GeneratorConfig",
    "TextGenerator",
]
