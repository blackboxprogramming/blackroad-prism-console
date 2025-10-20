from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict

from orchestrator import metrics
from tools import artifacts

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "coq"
FIXTURES = ROOT / "fixtures" / "mfg"
SCHEMA = ROOT / "contracts" / "schemas" / "mfg_coq.schema.json"


def build(period: str):
    path = FIXTURES / f"coq_{period}.csv"
    totals: Dict[str, float] = {}
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            bucket = row["bucket"]
            totals[bucket] = totals.get(bucket, 0.0) + float(row["cost"])
    ART_DIR.mkdir(parents=True, exist_ok=True)
    report = {"period": period, "buckets": totals}
    artifacts.validate_and_write(str(ART_DIR / "coq.json"), report, str(SCHEMA))
    artifacts.validate_and_write(
        str(ART_DIR / "coq.csv"),
        "bucket,cost\n" + "\n".join(f"{k},{v}" for k, v in totals.items()),
    )
    artifacts.validate_and_write(
        str(ART_DIR / "coq.md"),
        "\n".join(f"{k}: {v}" for k, v in totals.items()),
    )
    metrics.inc("coq_built")
    return totals
