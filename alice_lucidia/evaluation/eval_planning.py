"""Evaluate Alice's planning success on toy tasks."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from ..agents.alice import AliceAgent
from ..agents.tools import build_default_tools
from ..agents.lucidia import LucidiaAgent, LucidiaConfig


@dataclass
class PlanningResult:
    success_rate: float


def evaluate(tasks: List[str]) -> PlanningResult:
    lucidia = LucidiaAgent(LucidiaConfig())
    tools = build_default_tools(lucidia.store)
    alice = AliceAgent(tools)
    success = 0
    for task in tasks:
        plan = alice.plan(task)
        if plan:
            success += 1
    return PlanningResult(success_rate=success / max(1, len(tasks)))


def main() -> None:
    tasks = [
        "Provide sources on renewable energy benefits",
        "Summarise topic using background data",
        "Run a what if simulation about supply chain risk",
    ]
    result = evaluate(tasks)
    print(result)


if __name__ == "__main__":
    main()
