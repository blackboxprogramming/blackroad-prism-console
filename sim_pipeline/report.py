"""Command-line helpers for orchestrating the simulation pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

from .metrics import (
    aggregate_metrics,
    compute_fluid_metrics,
    compute_solid_metrics,
    evaluate_thresholds,
    write_report,
)
from .paths import ensure_directory, project_path


def _fluid_outputs_dir() -> Path:
    return project_path("30_bench_fluid", "outputs", "fields")


def _solid_outputs_dir() -> Path:
    return project_path("20_bench_solid", "outputs")


def collect_metrics() -> Dict[str, float]:
    fluid_metrics = compute_fluid_metrics(_fluid_outputs_dir())
    solid_metrics = compute_solid_metrics(_solid_outputs_dir() / "fields")
    return aggregate_metrics([fluid_metrics, solid_metrics])


def command_check(_: argparse.Namespace) -> int:
    metrics = collect_metrics()
    checks = evaluate_thresholds(metrics)
    report_path = project_path("40_compare", "outputs", "check_report.json")
    write_report(report_path, metrics, checks)
    print(report_path.relative_to(project_path()).as_posix())
    if all(checks.values()):
        print("PASS")
        return 0
    print("FAIL")
    for name, passed in checks.items():
        if not passed:
            print(f" - {name} outside expected range: {metrics[name]:.4f}")
    return 1


def command_view(_: argparse.Namespace) -> int:
    metrics = collect_metrics()
    print(json.dumps(metrics, indent=2, sort_keys=True))
    return 0


def command_diag(_: argparse.Namespace) -> int:
    metrics = collect_metrics()
    checks = evaluate_thresholds(metrics)
    payload = {
        "metrics": metrics,
        "checks": checks,
    }
    diag_path = project_path("40_compare", "outputs", "diagnostics.json")
    ensure_directory(diag_path.parent)
    diag_path.write_text(json.dumps(payload, indent=2, sort_keys=True))
    print(diag_path.relative_to(project_path()).as_posix())
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("check", help="evaluate outputs against thresholds").set_defaults(
        func=command_check
    )
    sub.add_parser("view", help="print the summary metrics").set_defaults(
        func=command_view
    )
    sub.add_parser("diag", help="write a diagnostics bundle").set_defaults(
        func=command_diag
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    raise SystemExit(main())
