"""SPH benchmark template using PySPH-like APIs.

The default implementation synthesizes placeholder data so downstream tooling can be
validated before the real solver is connected.
"""
from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path
from typing import Any, Dict

import numpy as np

FREE_SURFACE_GRID = (41, 31)  # (nx, ny) grid for height comparisons


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fluid SPH benchmark template")
    parser.add_argument("--output", type=Path, required=True, help="Run directory for outputs.")
    parser.add_argument("--duration", type=float, default=1.2)
    parser.add_argument("--dt", type=float, default=2.5e-4)
    parser.add_argument("--particle-spacing", type=float, default=0.004)
    parser.add_argument("--viscosity", type=float, default=0.015)
    parser.add_argument("--gravity", nargs=3, type=float, default=[0.0, 0.0, -9.81])
    parser.add_argument("--notes", type=str, default="")
    return parser.parse_args()


def ensure_layout(root: Path) -> None:
    (root / "fields").mkdir(parents=True, exist_ok=True)
    (root / "diagnostics").mkdir(parents=True, exist_ok=True)


def main() -> None:
    args = parse_args()
    ensure_layout(args.output)

    metadata = {
        "solver": "sph",
        "parameters": {
            "duration": args.duration,
            "dt": args.dt,
            "particle_spacing": args.particle_spacing,
            "viscosity": args.viscosity,
            "gravity": args.gravity,
        },
        "notes": args.notes,
    }

    start = time.perf_counter()
    results = simulate_with_sph(args)
    metadata["wall_time_seconds"] = time.perf_counter() - start

    export_outputs(results, args.output)
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"SPH run stored in {args.output}")


def simulate_with_sph(args: argparse.Namespace) -> Dict[str, Any]:
    times = np.arange(0.0, args.duration + 1e-9, 1.0 / 500.0)
    velocity = np.zeros((times.size, 10, 3))
    pressure = np.zeros((times.size, 10))
    height_grid = np.zeros((times.size, *FREE_SURFACE_GRID))

    for i, t in enumerate(times):
        velocity[i, :, 2] = -0.2 * np.exp(-t)
        pressure[i, :] = 101_325 + 2_000 * math.sin(t)
        height_grid[i] = 0.6 + 0.02 * np.sin(2 * math.pi * t) * np.outer(
            np.sin(np.linspace(0, math.pi, FREE_SURFACE_GRID[0])),
            np.sin(np.linspace(0, math.pi, FREE_SURFACE_GRID[1]))
        )

    return {
        "times": times,
        "velocity": velocity,
        "pressure": pressure,
        "free_surface": height_grid,
    }


def export_outputs(results: Dict[str, Any], output_dir: Path) -> None:
    np.savez_compressed(
        output_dir / "fields" / "fluid_fields.npz",
        times=results["times"],
        velocity=results["velocity"],
        pressure=results["pressure"],
    )
    np.save(output_dir / "diagnostics" / "free_surface.npy", results["free_surface"])


if __name__ == "__main__":
    main()
