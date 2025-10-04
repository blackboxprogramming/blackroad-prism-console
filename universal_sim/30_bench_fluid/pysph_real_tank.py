"""Run a coarse PySPH dam-break simulation and export grid samples."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Dict

import numpy as np

try:
    from pysph.examples.dam_break_2d import DamBreak2D  # type: ignore
    from pysph.solver.utils import get_files, iter_output  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    DamBreak2D = None

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from universal_sim.paths import PATHS
from universal_sim.stubs import fluid as fluid_stub

RHO0 = 1000.0


def _bin_average(x: np.ndarray, y: np.ndarray, values: np.ndarray, resolution: int) -> np.ndarray:
    grid = np.zeros((resolution, resolution), dtype=np.float32)
    counts = np.zeros_like(grid)
    x_norm = (x - x.min()) / max(x.max() - x.min(), 1e-6)
    y_norm = (y - y.min()) / max(y.max() - y.min(), 1e-6)
    xi = np.clip((x_norm * (resolution - 1)).astype(int), 0, resolution - 1)
    yi = np.clip((y_norm * (resolution - 1)).astype(int), 0, resolution - 1)
    flat_vals = values.reshape(values.shape[0], -1)[:, 0]
    for idx in range(len(xi)):
        grid[xi[idx], yi[idx]] += flat_vals[idx]
        counts[xi[idx], yi[idx]] += 1
    mask = counts > 0
    grid[mask] /= counts[mask]
    return grid


def _sample_surface(x: np.ndarray, z: np.ndarray, resolution: int) -> np.ndarray:
    heights = np.full(resolution, -np.inf, dtype=np.float32)
    x_norm = (x - x.min()) / max(x.max() - x.min(), 1e-6)
    xi = np.clip((x_norm * (resolution - 1)).astype(int), 0, resolution - 1)
    for idx, col in enumerate(xi):
        heights[col] = max(heights[col], z[idx])
    heights[np.isneginf(heights)] = 0.0
    return np.tile(heights[:, None], (1, resolution))


def _simulate_with_pysph(output_dir: Path, resolution: int) -> Dict[str, np.ndarray]:
    if DamBreak2D is None:
        raise RuntimeError("PySPH not installed")
    app = DamBreak2D(output_dir=str(output_dir))
    argv = [
        "--scheme",
        "wcsph",
        "--dx",
        "0.08",
        "--hdx",
        "1.3",
        "--tf",
        "0.4",
        "--print-log",
    ]
    app.run(argv=argv)
    files = get_files(app.output_dir)
    if not files:
        raise RuntimeError("PySPH did not produce any output files")
    _, fluid = next(iter_output(files[-1:], "fluid"))
    x = np.asarray(fluid.x)
    y = np.asarray(fluid.y)
    u = np.asarray(fluid.u)
    v = np.asarray(fluid.v)
    w = np.zeros_like(u)
    rho = np.asarray(fluid.rho)
    vel_grid = np.stack(
        [
            _bin_average(x, y, u, resolution),
            _bin_average(x, y, v, resolution),
            _bin_average(x, y, w, resolution),
        ],
        axis=-1,
    )
    # tile along depth axis to emulate a 3D field from depth-averaged samples
    velocity = np.repeat(vel_grid[:, :, None, :], resolution, axis=2)
    pressure = _bin_average(x, y, rho - RHO0, resolution)
    surface = _sample_surface(x, y, resolution)
    return {
        "velocity_t000400.npz": velocity.astype(np.float32),
        "pressure_t000400.npz": pressure.astype(np.float32),
        "surface_height_t000400.npy": surface.astype(np.float32),
    }


def run(output_dir: Path, resolution: int = 24, prefer_stub: bool = False) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        if prefer_stub:
            raise RuntimeError("Stub mode forced")
        fields = _simulate_with_pysph(output_dir, resolution)
        print("PySPH simulation completed; writing samples.")
    except Exception as exc:
        print(f"[fallback] Using stub generator due to: {exc}")
        fields = fluid_stub.benchmark_fields(resolution)
    fluid_stub.save_fields(fields, output_dir)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=PATHS.bench_fluid)
    parser.add_argument("--resolution", type=int, default=24)
    parser.add_argument("--force-stub", action="store_true", dest="force_stub")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    run(args.output, resolution=args.resolution, prefer_stub=args.force_stub)


if __name__ == "__main__":
    main()
