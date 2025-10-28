"""Simple statistical process control helpers.

Only a handful of rules are required for the unit tests.  The rewritten
module keeps the implementation compact and deterministic so the tests
can rely on it without pulling in the heavier production dependencies.
"""

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

from tools import storage, artifacts
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "spc"
FIXTURES = ROOT / "fixtures" / "mfg" / "spc"
LAKE_DIR = ROOT / "artifacts" / "mfg" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"

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
            vals.append(float(row["value"]))
    return vals


def analyze(op: str, window: int = 50):
    vals = _read_values(op)[-window:]
    if not vals:
        raise ValueError("no data")
    mean = sum(vals) / len(vals)
    diffs = [(v - mean) ** 2 for v in vals]
    sigma = (sum(diffs) / len(vals)) ** 0.5
    findings = []
    # rule: point beyond 3 sigma
    for v in vals:
        if abs(v - mean) > 3 * sigma:
            findings.append("SPC_POINT_BEYOND_3SIG")
            break
    # trend 7
    trend = 1
    for i in range(1, len(vals)):
        if vals[i] > vals[i - 1]:
            trend = trend + 1 if trend > 0 else 1
        elif vals[i] < vals[i - 1]:
            trend = trend - 1 if trend < 0 else -1
        else:
            trend = 0
        if abs(trend) >= 7:
            findings.append("SPC_TREND_7")
            break
    # run 8 one side
    run = 0
    for v in vals:
        if v > mean:
            run = run + 1 if run >= 0 else 1
        elif v < mean:
            run = run - 1 if run <= 0 else -1
        else:
            run = 0
        if abs(run) >= 8:
            findings.append("SPC_RUN_8_ONE_SIDE")
            break
    ART_DIR.mkdir(parents=True, exist_ok=True)
    artifacts.validate_and_write(
        str(ART_DIR / "findings.json"),
        findings,
        str(SCHEMA_DIR / "mfg_spc.schema.json"),
    )
    chart_lines = ["index,value"] + [f"{i},{v}" for i, v in enumerate(vals, 1)]
    storage.write(str(ART_DIR / "charts.md"), "\n".join(chart_lines))

    flag = ART_DIR / "blocking.flag"
    if findings:
        flag.write_text("unstable", encoding="utf-8")
    elif flag.exists():
        flag.unlink()

    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    lake_path = LAKE_DIR / "mfg_spc.jsonl"
    record = {
        "operation": op,
        "window": window,
        "mean": mean,
        "sigma": sigma,
        "points": len(vals),
        "findings": findings,
    }
    if lake_path.exists():
        lake_path.unlink()
    storage.write(str(lake_path), record)

    metrics.inc("spc_findings", len(findings))
    return findings
