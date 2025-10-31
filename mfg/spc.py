"""Statistical process control helpers for the unit tests."""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Dict, List

ART_DIR: Path = Path("artifacts/mfg/spc")
RULE_POINT_BEYOND_3SIG = "SPC_POINT_BEYOND_3SIG"
RULE_TREND_7 = "SPC_TREND_7"
RULE_RUN_8_ONE_SIDE = "SPC_RUN_8_ONE_SIDE"


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _stdev(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    mu = _mean(values)
    variance = sum((value - mu) ** 2 for value in values) / (len(values) - 1)
    return math.sqrt(variance)


def _load_series(op: str, csv_dir: str | Path) -> List[float]:
    path = Path(csv_dir) / f"{op}_sample.csv"
    if not path.exists():
        raise FileNotFoundError(path)
    series: List[float] = []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            try:
                series.append(float(row.get("measure", 0)))
            except ValueError:
                continue
    return series


def analyze(op: str, window: int, csv_dir: str | Path = Path("fixtures/mfg/spc")) -> Dict[str, object]:
    series = _load_series(op, csv_dir)
    if window > 0:
        series = series[-window:]
    if not series:
        raise ValueError("no samples available")

    mu = _mean(series)
    sigma = _stdev(series)
    findings: List[str] = []

    if sigma > 0:
        if any(abs(value - mu) > 3 * sigma for value in series):
            findings.append(RULE_POINT_BEYOND_3SIG)

        run = 0
        for value in series:
            if value > mu:
                run = run + 1 if run >= 0 else 1
            elif value < mu:
                run = run - 1 if run <= 0 else -1
            else:
                run = 0
            if abs(run) >= 8:
                findings.append(RULE_RUN_8_ONE_SIDE)
                break

    if len(series) >= 7:
        increasing = all(series[i] < series[i + 1] for i in range(len(series) - 1))
        decreasing = all(series[i] > series[i + 1] for i in range(len(series) - 1))
        if increasing or decreasing:
            findings.append(RULE_TREND_7)

    art_dir = _ensure_art_dir()
    report = {
        "op": op,
        "mean": mu,
        "sigma": sigma,
        "sample_size": len(series),
        "findings": findings,
        "unstable": bool(findings),
    }
    (art_dir / "report.json").write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")

    chart_lines = ["index,value"] + [f"{idx + 1},{value}" for idx, value in enumerate(series)]
    (art_dir / "charts.csv").write_text("\n".join(chart_lines), encoding="utf-8")

    flag_path = art_dir / "blocking.flag"
    if RULE_POINT_BEYOND_3SIG in findings:
        flag_path.write_text("SPC_BLOCK", encoding="utf-8")
    elif flag_path.exists():
        flag_path.unlink()

    return report


def cli_spc_analyze(argv: List[str] | None = None) -> Dict[str, object]:
    parser = argparse.ArgumentParser(prog="mfg:spc:analyze", description="Evaluate SPC rules")
    parser.add_argument("--op", required=True)
    parser.add_argument("--window", type=int, default=50)
    parser.add_argument("--csv-dir", default="fixtures/mfg/spc")
    args = parser.parse_args(argv)
    return analyze(args.op, args.window, args.csv_dir)


__all__ = [
    "analyze",
    "cli_spc_analyze",
    "_mean",
    "_stdev",
    "ART_DIR",
    "RULE_POINT_BEYOND_3SIG",
    "RULE_TREND_7",
    "RULE_RUN_8_ONE_SIDE",
]
