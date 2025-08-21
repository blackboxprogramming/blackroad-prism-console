"""Simple Program-of-Thought planner and executor."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import random
from typing import List, Optional


@dataclass
class Node:
    op: str
    data: dict


def _default_trace(question: str) -> List[Node]:
    return [
        Node("PLAN", {"question": question}),
        Node("STEP", {"id": 1, "text": f"Echo {question}"}),
        Node("YIELD", {"answer": question}),
    ]


def plan_question(question: str, n: int = 1, out_dir: Optional[str] = None, seed: int = 0) -> List[List[Node]]:
    """Generate ``n`` simple traces for a question."""
    random.seed(seed)
    traces: List[List[Node]] = []
    for i in range(n):
        trace = _default_trace(question)
        traces.append(trace)
        if out_dir:
            path = Path(out_dir)
            path.mkdir(parents=True, exist_ok=True)
            with open(path / f"trace_{i}.jsonl", "w", encoding="utf-8") as fh:
                for node in trace:
                    fh.write(json.dumps({"op": node.op, **node.data}) + "\n")
    return traces
