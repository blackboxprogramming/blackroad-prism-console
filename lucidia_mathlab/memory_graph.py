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
"""
Lucidia Math Memory Graph
Tracks relations between agents, equations, and generated artifacts.
"""

import json
import os
from datetime import datetime

import matplotlib.pyplot as plt
import networkx as nx


class MathMemoryGraph:
    def __init__(self, path="codex_logs"):
        self.path = path
        self.graph = nx.MultiDiGraph(name="LucidiaMathGraph")

    def load_logs(self):
        for file in os.listdir(self.path):
            if file.endswith(".json"):
                with open(os.path.join(self.path, file)) as f:
                    data = json.load(f)
                    self._ingest_log(file, data)

    def _ingest_log(self, file, data):
        agent = data.get("agent")
        prompt = data.get("prompt", "")[:80]
        node_id = f"{file}_{agent}"
        self.graph.add_node(node_id, label=agent, prompt=prompt, ts=file[:19])
        self.graph.add_edge(agent, node_id, relation="produced")

    def render(self, out_path="codex_logs/math_graph.png"):
        plt.figure(figsize=(12, 8))
        pos = nx.spring_layout(self.graph, k=0.4)
        nx.draw_networkx_nodes(self.graph, pos, node_size=500, node_color="#77aaff")
        nx.draw_networkx_edges(self.graph, pos, arrowstyle="->", arrowsize=12)
        nx.draw_networkx_labels(self.graph, pos, font_size=9)
        plt.axis("off")
        plt.tight_layout()
        plt.savefig(out_path)
        print(f"[✓] Graph rendered → {out_path}")


if __name__ == "__main__":
    graph = MathMemoryGraph()
    graph.load_logs()
    graph.render()
