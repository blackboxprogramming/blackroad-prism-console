"""Durable queue utilities for Codex-34."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterator, List


@dataclass
class DurableQueue:
    """A simple JSONL-backed durable queue."""

    path: Path
    max_depth: int = 5000

    def __post_init__(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("", encoding="utf-8")

    def enqueue(self, item: Dict[str, object]) -> None:
        items = list(self._iter_items())
        items.append(item)
        if len(items) > self.max_depth:
            raise OverflowError("Queue depth exceeded")
        with self.path.open("w", encoding="utf-8") as handle:
            for entry in items:
                handle.write(json.dumps(entry) + "\n")

    def peek(self, limit: int = 1) -> List[Dict[str, object]]:
        return list(self._iter_items(limit))

    def dequeue(self, limit: int = 1) -> List[Dict[str, object]]:
        items = list(self._iter_items())
        batch = items[:limit]
        remaining = items[limit:]
        with self.path.open("w", encoding="utf-8") as handle:
            for entry in remaining:
                handle.write(json.dumps(entry) + "\n")
        return batch

    def __len__(self) -> int:
        return sum(1 for _ in self._iter_items())

    def _iter_items(self, limit: int | None = None) -> Iterator[Dict[str, object]]:
        with self.path.open("r", encoding="utf-8") as handle:
            count = 0
            for line in handle:
                if not line.strip():
                    continue
                yield json.loads(line)
                count += 1
                if limit is not None and count >= limit:
                    break


__all__ = ["DurableQueue"]
