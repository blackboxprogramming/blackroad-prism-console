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
