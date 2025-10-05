"""Taichi-FLIP style benchmark template."""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any, Dict

import numpy as np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fluid FLIP benchmark template")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--duration", type=float, default=1.2)
    parser.add_argument("--dt", type=float, default=2.5e-4)
    parser.add_argument("--grid", nargs=3, type=int, default=[180, 120, 180])
    parser.add_argument("--notes", type=str, default="")
    return parser.parse_args()


def ensure_layout(root: Path) -> None:
    (root / "fields").mkdir(parents=True, exist_ok=True)
    (root / "diagnostics").mkdir(parents=True, exist_ok=True)


def main() -> None:
    args = parse_args()
    ensure_layout(args.output)

    metadata = {
        "solver": "flip",
        "parameters": {
            "duration": args.duration,
            "dt": args.dt,
            "grid": args.grid,
        },
        "notes": args.notes,
    }

    start = time.perf_counter()
    results = simulate_with_flip(args)
    metadata["wall_time_seconds"] = time.perf_counter() - start

    export_outputs(results, args.output)
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"FLIP run stored in {args.output}")


def simulate_with_flip(args: argparse.Namespace) -> Dict[str, Any]:
    times = np.arange(0.0, args.duration + 1e-9, 1.0 / 500.0)
    velocity = np.zeros((times.size, *args.grid, 3))
    pressure = np.zeros((times.size, *args.grid))
    for i, t in enumerate(times):
        velocity[i, ..., 2] = -0.1 * np.exp(-t)
        pressure[i] = 101_325 + 1_500 * np.cos(t)
    return {"times": times, "velocity": velocity, "pressure": pressure}


def export_outputs(results: Dict[str, Any], output_dir: Path) -> None:
    np.savez_compressed(
        output_dir / "fields" / "flip_fields.npz",
        times=results["times"],
        velocity=results["velocity"],
        pressure=results["pressure"],
    )


if __name__ == "__main__":
    main()
