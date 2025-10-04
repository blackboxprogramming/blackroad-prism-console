from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Iterable, List


def run_core(grid_n: int, params: Path, output_root: Path) -> None:
    script = Path(__file__).parents[1] / "20_bench_solid" / "taichi_mpm_core.py"
    cmd = [
        sys.executable,
        str(script),
        "--params",
        str(params),
        "--grid-n",
        str(grid_n),
        "--output-root",
        str(output_root),
    ]
    subprocess.run(cmd, check=True)


def sweep(grid_settings: Iterable[int], params: Path, output_root: Path) -> List[dict]:
    results: List[dict] = []
    for grid_n in grid_settings:
        target = output_root / f"n{grid_n}"
        target.mkdir(parents=True, exist_ok=True)
        print(f"\n=== Running Taichi MPM core at grid {grid_n} ===")
        run_core(grid_n, params, target)
        results.append({"grid_n": grid_n, "output_root": str(target.resolve())})
    return results


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sweep Taichi MPM grid resolutions for convergence studies")
    parser.add_argument(
        "--params",
        type=Path,
        default=Path(__file__).parents[1] / "20_bench_solid" / "params.json",
        help="Path to the shared simulation parameter file",
    )
    parser.add_argument(
        "--grid",
        type=int,
        nargs="+",
        default=[32, 48, 64],
        help="List of grid sizes to simulate",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path("outputs") / "sweeps",
        help="Directory where sweep artifacts are written",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_root = args.output_root
    output_root.mkdir(parents=True, exist_ok=True)
    results = sweep(args.grid, args.params, output_root)
    summary_path = output_root / "sweep_summary.json"
    summary_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nSweep summary written to {summary_path.resolve()}")


if __name__ == "__main__":
    main()
