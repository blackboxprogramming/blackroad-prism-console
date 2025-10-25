"""Learning rate and sequence-length schedules for BR-NOVA training."""

from __future__ import annotations

import dataclasses
import json
import math
from typing import Iterable, List


@dataclasses.dataclass
class CosineSchedule:
    base_lr: float
    warmup_steps: int
    total_steps: int
    min_lr_ratio: float = 0.05

    def lr_at(self, step: int) -> float:
        if step < self.warmup_steps:
            return self.base_lr * (step + 1) / max(self.warmup_steps, 1)
        progress = min(1.0, (step - self.warmup_steps) / max(self.total_steps - self.warmup_steps, 1))
        cosine = 0.5 * (1 + math.cos(math.pi * progress))
        return self.base_lr * (self.min_lr_ratio + (1 - self.min_lr_ratio) * cosine)


@dataclasses.dataclass
class LengthRamp:
    start: int
    end: int
    milestones: List[int]

    def length_at(self, step: int) -> int:
        if not self.milestones:
            return self.end
        ordered = sorted(self.milestones)
        for milestone in ordered:
            if step < milestone:
                return self.start
        return self.end


def export_schedule(lr: CosineSchedule, ramp: LengthRamp, steps: Iterable[int]) -> List[dict]:
    payload: List[dict] = []
    for step in steps:
        payload.append({
            "step": step,
            "learning_rate": lr.lr_at(step),
            "max_length": ramp.length_at(step),
        })
    return payload


def export_to_json(lr: CosineSchedule, ramp: LengthRamp, steps: Iterable[int], path: str) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(export_schedule(lr, ramp, steps), handle, indent=2)
