"""Lightweight acceptance checks for Genesis and solver outputs."""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Tuple


@dataclass
class EnergySummary:
    samples: int
    min_dt: float
    max_dt: float
    max_vmax: float
    max_ratio: float


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check solver outputs against heuristics.")
    parser.add_argument(
        "--variant",
        type=str,
        default=None,
        help="Optional Genesis variant name (maps to outputs_<variant>).",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Repository root containing 10_genesis/ and 20_bench_solid/",
    )
    return parser.parse_args(argv)


def load_params(params_path: Path) -> Tuple[float, float, float]:
    data = json.loads(params_path.read_text())
    grid_n = int(data["grid_n"])
    dt_min = float(data.get("dt_min", 0.0))
    cfl_max = float(data.get("cfl_max", 0.0))
    dx = 1.0 / grid_n if grid_n else 0.0
    return dt_min, cfl_max, dx


def locate_energy_log(base: Path, variant: Optional[str]) -> Optional[Path]:
    candidates: List[Path] = []
    if variant:
        candidates.append(base / f"outputs_{variant}" / "logs" / "energy.csv")
        candidates.append(base / f"outputs-{variant}" / "logs" / "energy.csv")
    candidates.append(base / "outputs" / "logs" / "energy.csv")
    candidates.append(base / "outputs" / "energy.csv")
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def check_energy_log(
    log_path: Path,
    *,
    dt_min: float,
    cfl_max: float,
    expected_dx: float,
    eps: float = 1.0e-9,
) -> Tuple[List[str], EnergySummary]:
    errors: List[str] = []
    summary = EnergySummary(samples=0, min_dt=math.inf, max_dt=0.0, max_vmax=0.0, max_ratio=0.0)

    with log_path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"step", "dt", "vmax", "cfl_dt", "dx"}
        if reader.fieldnames is None or required - set(reader.fieldnames):
            missing = required - set(reader.fieldnames or [])
            errors.append(
                f"Energy log {log_path} is missing columns: {', '.join(sorted(missing))}."
            )
            return errors, summary

        for index, row in enumerate(reader):
            summary.samples += 1
            try:
                dt = float(row["dt"])
                vmax = float(row["vmax"])
                cfl_dt = float(row["cfl_dt"])
                dx = float(row["dx"])
            except (TypeError, ValueError) as exc:
                errors.append(f"Row {index} in {log_path} could not be parsed: {exc}.")
                continue

            summary.min_dt = min(summary.min_dt, dt)
            summary.max_dt = max(summary.max_dt, dt)
            summary.max_vmax = max(summary.max_vmax, abs(vmax))
            if cfl_dt > eps:
                summary.max_ratio = max(summary.max_ratio, dt / cfl_dt)

            if dt_min > 0.0 and dt + eps < dt_min:
                errors.append(
                    f"Row {index}: dt={dt:.6g} fell below dt_min={dt_min:.6g}."
                )
            if cfl_dt >= eps and dt - cfl_dt > 5.0e-7:
                errors.append(
                    f"Row {index}: dt={dt:.6g} exceeded cfl_dt={cfl_dt:.6g}."
                )
            if expected_dx > 0.0 and abs(dx - expected_dx) > max(expected_dx, 1.0) * 1.0e-6:
                errors.append(
                    f"Row {index}: dx={dx:.6g} did not match expected {expected_dx:.6g}."
                )

            if cfl_max > 0.0 and expected_dx > 0.0:
                predicted = cfl_max * expected_dx / (abs(vmax) + 1.0e-8)
                if abs(predicted - cfl_dt) > max(predicted, 1.0) * 1.0e-3:
                    errors.append(
                        f"Row {index}: reported cfl_dt={cfl_dt:.6g} "
                        f"deviates from computed {predicted:.6g}."
                    )

    if summary.samples == 0:
        errors.append(f"Energy log {log_path} contained no samples.")

    return errors, summary


def require_variant_outputs(genesis_dir: Path) -> List[str]:
    if not genesis_dir.exists():
        return [f"Expected Genesis outputs at {genesis_dir}."]
    try:
        next(genesis_dir.iterdir())
    except StopIteration:
        return [f"No files found in {genesis_dir}; run the variant before checking."]
    except PermissionError as exc:
        return [f"Unable to read {genesis_dir}: {exc}."]
    return []


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    root = args.root.resolve()

    errors: List[str] = []
    warnings: List[str] = []

    params_path = root / "20_bench_solid" / "params.json"
    if not params_path.exists():
        errors.append(f"Missing parameters file at {params_path}.")
        dt_min = cfl_max = expected_dx = 0.0
    else:
        dt_min, cfl_max, expected_dx = load_params(params_path)

    variant_suffix = f"outputs_{args.variant}" if args.variant else "outputs"
    genesis_dir = root / "10_genesis" / variant_suffix
    errors.extend(require_variant_outputs(genesis_dir))

    energy_log = locate_energy_log(root / "20_bench_solid", args.variant)
    energy_summary: Optional[EnergySummary] = None
    if energy_log is None:
        warnings.append("CFL log not found; skipping timestep verification.")
    else:
        energy_errors, energy_summary = check_energy_log(
            energy_log,
            dt_min=max(dt_min, 0.0),
            cfl_max=max(cfl_max, 0.0),
            expected_dx=expected_dx,
        )
        errors.extend(energy_errors)

    if warnings:
        for warning in warnings:
            print(f"[WARN] {warning}")

    if errors:
        print("[FAIL] Threshold checks failed:")
        for issue in errors:
            print(f" - {issue}")
        return 1

    print("[PASS] Threshold checks succeeded.")
    if energy_summary is not None and energy_summary.samples > 0:
        print(
            "    samples={samples} dt[min,max]=[{min_dt:.6g}, {max_dt:.6g}] vmax={max_vmax:.6g} "
            "dt/cfl_max={max_ratio:.4g}".format(
                samples=energy_summary.samples,
                min_dt=energy_summary.min_dt,
                max_dt=energy_summary.max_dt,
                max_vmax=energy_summary.max_vmax,
                max_ratio=energy_summary.max_ratio,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
"""Compare Genesis outputs to benchmark volumes and enforce success thresholds."""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Tuple

import numpy as np

DEFAULT_TIMESTAMP = "t000400"
DEFAULT_GENESIS_DIR = Path("10_genesis/outputs")
DEFAULT_SOLID_DIR = Path("20_bench_solid/outputs")
DEFAULT_FLUID_DIR = Path("30_bench_fluid/outputs")
DEFAULT_THRESHOLDS = Path("40_compare/thresholds.json")


@dataclass
class MetricResult:
    name: str
    value: float
    limit: float
    passed: bool


def _load_npz(path: Path) -> Dict[str, np.ndarray]:
    with np.load(path) as data:  # type: ignore[call-arg]
        return {name: data[name] for name in data.files}


def _compute_metrics(a: np.ndarray, b: np.ndarray) -> Dict[str, float]:
    diff = a - b
    return {
        "mae": float(np.mean(np.abs(diff))),
        "max_abs": float(np.max(np.abs(diff))),
        "rmse": float(np.sqrt(np.mean(diff**2))),
    }


def _check_field(
    field: str,
    generated: np.ndarray,
    reference: np.ndarray,
    thresholds: Dict[str, float],
) -> Iterable[MetricResult]:
    metrics = _compute_metrics(generated, reference)
    for metric_name, limit in thresholds.items():
        value = metrics.get(metric_name)
        if value is None:
            raise KeyError(f"Metric '{metric_name}' not supported for {field}")
        yield MetricResult(metric_name, value, limit, value <= limit)


def _resolve_paths(base: Path, timestamp: str) -> Path:
    path = base / timestamp
    if not path.exists():
        raise FileNotFoundError(f"Expected directory not found: {path}")
    return path


def _evaluate_volume(
    label: str,
    generated: Path,
    benchmark: Path,
    thresholds: Dict[str, Dict[str, Dict[str, float]]],
) -> Tuple[bool, Dict[str, Iterable[MetricResult]]]:
    gen_npz = generated / f"{label}_volume.npz"
    bench_npz = benchmark / f"{label}_volume.npz"
    if not gen_npz.exists():
        raise FileNotFoundError(f"Missing generated volume: {gen_npz}")
    if not bench_npz.exists():
        raise FileNotFoundError(f"Missing benchmark volume: {bench_npz}")

    gen_fields = _load_npz(gen_npz)
    bench_fields = _load_npz(bench_npz)

    all_pass = True
    results: Dict[str, Iterable[MetricResult]] = {}
    for field, metric_limits in thresholds.get(f"{label}_volume", {}).items():
        if field not in gen_fields:
            raise KeyError(f"Field '{field}' not found in {gen_npz}")
        if field not in bench_fields:
            raise KeyError(f"Field '{field}' not found in {bench_npz}")
        metrics = list(
            _check_field(field, gen_fields[field], bench_fields[field], metric_limits)
        )
        results[field] = metrics
        all_pass &= all(m.passed for m in metrics)
    return all_pass, results


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timestamp", default=DEFAULT_TIMESTAMP)
    parser.add_argument("--genesis", type=Path, default=DEFAULT_GENESIS_DIR)
    parser.add_argument("--solid", type=Path, default=DEFAULT_SOLID_DIR)
    parser.add_argument("--fluid", type=Path, default=DEFAULT_FLUID_DIR)
    parser.add_argument("--thresholds", type=Path, default=DEFAULT_THRESHOLDS)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    thresholds = json.loads(args.thresholds.read_text())

    try:
        solid_dir = _resolve_paths(args.solid, args.timestamp)
        fluid_dir = _resolve_paths(args.fluid, args.timestamp)
        genesis_dir = _resolve_paths(args.genesis, args.timestamp)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}")
        raise SystemExit(2)

    success = True

    solid_pass, solid_results = _evaluate_volume(
        "solid", genesis_dir, solid_dir, thresholds
    )
    fluid_pass, fluid_results = _evaluate_volume(
        "fluid", genesis_dir, fluid_dir, thresholds
    )
    success &= solid_pass and fluid_pass

    def report(label: str, results: Dict[str, Iterable[MetricResult]]) -> None:
        print(f"=== {label.upper()} VOLUME ===")
        for field, metrics in results.items():
            print(f"Field: {field}")
            for metric in metrics:
                status = "PASS" if metric.passed else "FAIL"
                print(
                    f"  {metric.name:>7}: {metric.value:.6f}"
                    f" (limit {metric.limit:.6f}) -> {status}"
                )
            print()

    report("solid", solid_results)
    report("fluid", fluid_results)

    if success:
        print("All thresholds satisfied.")
        raise SystemExit(0)
    print("Threshold check failed.")
    raise SystemExit(1)


if __name__ == "__main__":
    main()
