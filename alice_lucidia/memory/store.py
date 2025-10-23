"""Persistence helpers for the Lucidia memory."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List

import torch
from torch import Tensor

from .index import HybridMemoryIndex, MemoryEntry


@dataclass
class MemoryRecord:
    key: str
    value: str
    metadata: Dict[str, str]
    vector: List[float]
    pinned: bool = False


class MemoryStore:
    """Simple JSON-based memory store with pin/expire semantics."""

    def __init__(self, dim: int, path: Path) -> None:
        self.path = path
        self.index = HybridMemoryIndex(dim)
        if path.exists():
            self.load()

    def write(self, key: str, vector: Tensor, value: str, metadata: Dict[str, str]) -> None:
        metadata = {**metadata, "key": key}
        self.index.gated_write(vector, value, metadata, confidence=float(metadata.get("confidence", 1.0)))

    def read(self, query: Tensor, k: int = 5) -> List[MemoryEntry]:
        return [entry for _, entry in self.index.search(query, k=k)]

    def pin(self, key: str) -> None:
        for entry in self.index.state.entries:
            if entry.metadata.get("key") == key:
                entry.pinned = True
        self.index._refresh_index()

    def expire(self, threshold: float = 0.1) -> None:
        self.index.expire(lambda entry: float(entry.metadata.get("confidence", 1.0)) < threshold)

    def save(self) -> None:
        records = [
            MemoryRecord(
                key=entry.metadata.get("key", ""),
                value=entry.value,
                metadata=entry.metadata,
                vector=entry.vector.tolist(),
                pinned=entry.pinned,
            )
            for entry in self.index.state.entries
        ]
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps([asdict(rec) for rec in records], indent=2))

    def load(self) -> None:
        if not self.path.exists():
            return
        data = json.loads(self.path.read_text())
        for record in data:
            vector = torch.tensor(record["vector"], dtype=torch.float32)
            self.index.add(vector, record["value"], record["metadata"], pinned=record.get("pinned", False))


__all__ = ["MemoryStore", "MemoryRecord"]
