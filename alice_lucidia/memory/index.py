"""FAISS-backed memory index with write policies."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Tuple

import numpy as np
import torch
from torch import Tensor

try:  # pragma: no cover - optional heavy dependency
    import faiss
except Exception:  # pragma: no cover
    faiss = None  # type: ignore


@dataclass
class MemoryEntry:
    vector: np.ndarray
    metadata: Dict[str, str]
    value: str
    pinned: bool = False


@dataclass
class MemoryState:
    dim: int
    entries: List[MemoryEntry] = field(default_factory=list)


class HybridMemoryIndex:
    """Combines FAISS retrieval with learned write policies."""

    def __init__(self, dim: int) -> None:
        self.state = MemoryState(dim=dim)
        if faiss is not None:  # pragma: no cover
            self.index = faiss.IndexFlatIP(dim)
        else:
            self.index = None

    def _refresh_index(self) -> None:
        if self.index is None:
            return
        vectors = np.stack([entry.vector for entry in self.state.entries]) if self.state.entries else np.zeros((0, self.state.dim), dtype="float32")
        self.index.reset()
        if vectors.size:
            self.index.add(vectors)

    def add(self, vector: Tensor, value: str, metadata: Dict[str, str], pinned: bool = False) -> None:
        np_vec = vector.detach().cpu().numpy().astype("float32")
        self.state.entries.append(MemoryEntry(vector=np_vec, metadata=metadata, value=value, pinned=pinned))
        if self.index is None:
            return
        self.index.add(np_vec[None, :])

    def search(self, query: Tensor, k: int = 5) -> List[Tuple[Tensor, MemoryEntry]]:
        query_np = query.detach().cpu().numpy().astype("float32")
        if self.index is not None and self.index.ntotal:
            scores, idx = self.index.search(query_np[None, :], k)
            results = []
            for score, index in zip(scores[0], idx[0]):
                if index == -1:
                    continue
                entry = self.state.entries[index]
                results.append((torch.from_numpy(entry.vector), entry))
            return results
        # Fallback cosine similarity
        results: List[Tuple[Tensor, MemoryEntry]] = []
        for entry in self.state.entries:
            vec = torch.from_numpy(entry.vector)
            sim = torch.dot(vec, torch.from_numpy(query_np))
            results.append((vec, entry))
        results.sort(key=lambda item: torch.dot(item[0], torch.from_numpy(query_np)), reverse=True)
        return results[:k]

    def expire(self, predicate) -> None:
        self.state.entries = [entry for entry in self.state.entries if entry.pinned or not predicate(entry)]
        self._refresh_index()

    def gated_write(self, vector: Tensor, value: str, metadata: Dict[str, str], confidence: float) -> None:
        if confidence < 0.2:
            return
        pinned = metadata.get("importance", "normal") == "pinned"
        self.add(vector, value, metadata, pinned=pinned)

    def ema_update(self, key: str, new_vector: Tensor, decay: float = 0.95) -> None:
        for entry in self.state.entries:
            if entry.metadata.get("key") == key:
                entry.vector = decay * entry.vector + (1 - decay) * new_vector.detach().cpu().numpy().astype("float32")
        self._refresh_index()


__all__ = ["HybridMemoryIndex", "MemoryEntry", "MemoryState"]
