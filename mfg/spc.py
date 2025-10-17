from __future__ import annotations

import csv
from pathlib import Path
from typing import List

from tools import storage, artifacts
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "spc"
FIXTURES = ROOT / "fixtures" / "mfg" / "spc"
LAKE_DIR = ROOT / "artifacts" / "mfg" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"


def _read_values(op: str) -> List[float]:
    path = FIXTURES / f"{op}.csv"
    vals = []
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
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
