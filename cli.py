"""Command line entrypoint for the universal simulation starter."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict

from universal_sim import SimulationOrchestrator
from universal_sim.metrics import compute, read, write
from universal_sim.paths import PATHS
from universal_sim.report import write_report


def _load_metrics() -> Dict:
    try:
        return read(PATHS.metrics_path)
    except FileNotFoundError:
        return {}


def orchestrate(mode: str, force: bool) -> None:
    orchestrator = SimulationOrchestrator()
    orchestrator.prepare(mode=mode, force=force)
    print(f"Prepared artifacts in {orchestrator.paths.artifacts} using mode='{mode}'.")


def run_checks() -> Dict:
    metrics = compute(PATHS)
    write(metrics, PATHS.metrics_path)
    print(f"Wrote metrics to {PATHS.metrics_path}.")
    return metrics


def build_report(metrics: Dict | None = None) -> Path:
    if metrics is None:
        metrics = _load_metrics()
    report_path = write_report(metrics, PATHS.report_path)
    print(f"Report available at {report_path}.")
    return report_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        nargs="?",
        choices=["orchestrate", "check", "report", "all"],
        default="orchestrate",
        help="Pipeline stage to execute.",
    )
    parser.add_argument(
        "--mode",
        choices=["stub", "real"],
        default="stub",
        help="Select whether to populate stub data or require real solver output.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite bench artifacts when running in stub mode.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    metrics: Dict | None = None
    if args.command in {"orchestrate", "all"}:
        orchestrate(args.mode, args.force)
    if args.command in {"check", "all"}:
        metrics = run_checks()
    if args.command in {"report", "all"}:
        build_report(metrics)


if __name__ == "__main__":
    main()
