"""Evaluate memory recall on synthetic rare facts."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from ..agents.lucidia import LucidiaAgent, LucidiaConfig


@dataclass
class MemoryEvalResult:
    recall: float
    baseline_recall: float


def evaluate(agent: LucidiaAgent, queries: List[str], answers: List[str]) -> MemoryEvalResult:
    hits = 0
    baseline_hits = 0
    for query, answer in zip(queries, answers):
        retrieved = agent.recall(query, k=3)
        if answer in retrieved:
            hits += 1
        if queries.index(query) < len(answers):
            baseline_hits += int(query in answers)
    recall = hits / max(1, len(queries))
    baseline = baseline_hits / max(1, len(queries))
    return MemoryEvalResult(recall=recall, baseline_recall=baseline)


def main() -> None:
    agent = LucidiaAgent(LucidiaConfig())
    facts = [
        ("helium discovery", "Helium was first detected in the sun."),
        ("first programmer", "Ada Lovelace is often regarded as the first programmer."),
    ]
    for key, value in facts:
        agent.write_fact(key, value, {"confidence": "0.9", "importance": "pinned"})
    result = evaluate(agent, [q for q, _ in facts], [a for _, a in facts])
    print(result)


if __name__ == "__main__":
    main()
