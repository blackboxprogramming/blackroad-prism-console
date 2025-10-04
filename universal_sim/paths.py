"""Canonical paths for the universal simulation workspace."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class SimulationPaths:
    """Container with all filesystem locations used by the pipeline."""

    root: Path = Path(__file__).resolve().parent

    @property
    def artifacts(self) -> Path:
        return self.root / "artifacts"

    @property
    def baseline_fluid(self) -> Path:
        return self.artifacts / "baseline" / "fluid"

    @property
    def baseline_solid(self) -> Path:
        return self.artifacts / "baseline" / "solid"

    @property
    def bench_fluid(self) -> Path:
        return self.artifacts / "bench" / "fluid"

    @property
    def bench_solid(self) -> Path:
        return self.artifacts / "bench" / "solid"

    @property
    def metrics_path(self) -> Path:
        return self.artifacts / "metrics.json"

    @property
    def report_path(self) -> Path:
        return self.artifacts / "report.md"

    def ensure_directories(self) -> None:
        for folder in self._all_directories():
            folder.mkdir(parents=True, exist_ok=True)

    def _all_directories(self) -> Iterable[Path]:
        return (
            self.artifacts,
            self.baseline_fluid,
            self.baseline_solid,
            self.bench_fluid,
            self.bench_solid,
        )


PATHS = SimulationPaths()
