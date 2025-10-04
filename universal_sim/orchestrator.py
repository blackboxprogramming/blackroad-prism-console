"""Simple orchestration helpers to flip between stub and real outputs."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .paths import SimulationPaths, PATHS
from .stubs import fluid as fluid_stub
from .stubs import solid as solid_stub

Mode = Literal["stub", "real"]


@dataclass
class SimulationOrchestrator:
    paths: SimulationPaths = PATHS

    def prepare(self, mode: Mode = "stub", force: bool = False) -> None:
        self.paths.ensure_directories()
        self._ensure_baseline()
        if mode == "stub":
            self._write_stub_bench(force=force)
        elif mode == "real":
            self._validate_real_outputs()
        else:
            raise ValueError(f"Unsupported mode: {mode}")

    def _ensure_baseline(self) -> None:
        if not any(self.paths.baseline_fluid.iterdir()):
            fluid_stub.save_fields(fluid_stub.baseline_fields(), self.paths.baseline_fluid)
        if not any(self.paths.baseline_solid.iterdir()):
            solid_stub.save_fields(solid_stub.baseline_fields(), self.paths.baseline_solid)

    def _write_stub_bench(self, force: bool = False) -> None:
        if force or not any(self.paths.bench_fluid.iterdir()):
            self._maybe_clean(self.paths.bench_fluid, force=True)
            fluid_stub.save_fields(fluid_stub.benchmark_fields(), self.paths.bench_fluid)
        if force or not any(self.paths.bench_solid.iterdir()):
            self._maybe_clean(self.paths.bench_solid, force=True)
            solid_stub.save_fields(solid_stub.benchmark_fields(), self.paths.bench_solid)

    def _validate_real_outputs(self) -> None:
        required = [
            self.paths.bench_fluid / "velocity_t000400.npz",
            self.paths.bench_fluid / "pressure_t000400.npz",
            self.paths.bench_fluid / "surface_height_t000400.npy",
            self.paths.bench_solid / "displacement_t000400.npz",
            self.paths.bench_solid / "von_mises_t000400.npy",
        ]
        missing = [str(p) for p in required if not p.exists()]
        if missing:
            raise FileNotFoundError(
                "\n".join(
                    ["Real run artifacts missing. Run `make pysph-real` and/or `make mpm-real` first:"]
                    + missing
                )
            )

    def _maybe_clean(self, directory: Path, force: bool) -> None:
        directory.mkdir(parents=True, exist_ok=True)
        if not force:
            return
        for item in directory.iterdir():
            if item.is_file():
                item.unlink()
