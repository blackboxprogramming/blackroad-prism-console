"""Thermal sampling utilities for station dashboards."""
from __future__ import annotations

from dataclasses import dataclass
from statistics import mean
from typing import Iterable, List


@dataclass(frozen=True)
class ThermalSample:
    position: str
    temperature_c: float


@dataclass(frozen=True)
class ThermalReport:
    hottest_c: float
    coolest_c: float
    average_c: float
    fan_rpm: int


def summarise(samples: Iterable[ThermalSample], fan_rpm: int) -> ThermalReport:
    temps = [sample.temperature_c for sample in samples]
    if not temps:
        raise ValueError("At least one thermal sample is required.")
    return ThermalReport(
        hottest_c=max(temps),
        coolest_c=min(temps),
        average_c=mean(temps),
        fan_rpm=fan_rpm,
    )


__all__ = ["ThermalSample", "ThermalReport", "summarise"]
