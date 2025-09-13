from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import List

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "spc"
FIXTURES = ROOT / "fixtures" / "mfg" / "spc"


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
    storage.write(str(ART_DIR / "findings.json"), json.dumps(findings, indent=2))
    chart_lines = ["index,value"] + [f"{i},{v}" for i, v in enumerate(vals, 1)]
    storage.write(str(ART_DIR / "charts.md"), "\n".join(chart_lines))
    return findings
