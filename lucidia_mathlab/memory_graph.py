"""Lightweight persistence layer for Codex prompt summaries."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable


class MemoryGraph:
    """Persist Codex exchanges for Lucidia MathLab continuity."""

    def __init__(self, store_path: str | None = None) -> None:
        self.store_path = Path(store_path) if store_path else Path("lucidia_mathlab/memory_graph.jsonl")
        self.store_path.parent.mkdir(parents=True, exist_ok=True)

    def _append_record(self, record: Dict[str, object]) -> None:
        with self.store_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    def record_prompt_summary(self, *, agent: str, prompt: str, output: str, log_path: str, source: str) -> None:
        """Record a single prompt execution in the memory graph."""
        self._append_record(
            {
                "type": "prompt_execution",
                "agent": agent,
                "prompt": prompt,
                "output": output,
                "log_path": log_path,
                "source": source,
            }
        )

    def record_summary_snapshot(self, *, summary_path: str, results: Dict[str, Dict[str, object]]) -> None:
        """Record the aggregate summary file for a run of prompts."""
        self._append_record(
            {
                "type": "summary_snapshot",
                "summary_path": summary_path,
                "results": results,
            }
        )

    def iter_records(self) -> Iterable[Dict[str, object]]:
        """Yield each stored record as a dictionary."""
        if not self.store_path.exists():
            return
        with self.store_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if line.strip():
                    yield json.loads(line)
