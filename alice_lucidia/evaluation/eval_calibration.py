"""Calibration metrics for Lucidia predictions."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

import torch

from ..agents.lucidia import LucidiaAgent, LucidiaConfig


@dataclass
class CalibrationResult:
    ece: float


def expected_calibration_error(confidences: List[float], outcomes: List[int], bins: int = 5) -> float:
    bins_edges = torch.linspace(0, 1, bins + 1)
    ece = torch.tensor(0.0)
    for i in range(bins):
        mask = [c for c in confidences if bins_edges[i] <= c < bins_edges[i + 1]]
        if not mask:
            continue
        idx = [j for j, c in enumerate(confidences) if bins_edges[i] <= c < bins_edges[i + 1]]
        acc = torch.tensor([outcomes[j] for j in idx], dtype=torch.float32).mean()
        conf = torch.tensor(mask, dtype=torch.float32).mean()
        ece += torch.abs(acc - conf) * len(idx) / max(1, len(confidences))
    return float(ece.item())


def evaluate() -> CalibrationResult:
    agent = LucidiaAgent(LucidiaConfig())
    confidences: List[float] = []
    outcomes: List[int] = []
    for i in range(10):
        text = f"fact {i}"
        agent.write_fact(f"key{i}", text, {"confidence": str(0.5 + i * 0.05)})
        recall = agent.recall(text)
        confidences.append(min(1.0, 0.5 + i * 0.05))
        outcomes.append(int(bool(recall)))
    ece = expected_calibration_error(confidences, outcomes)
    return CalibrationResult(ece=ece)


def main() -> None:
    print(evaluate())


if __name__ == "__main__":
    main()
