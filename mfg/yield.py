from __future__ import annotations

import csv
from pathlib import Path

from tools import storage, artifacts
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "yield"
FIXTURES = ROOT / "fixtures" / "mfg"
LAKE_DIR = ROOT / "artifacts" / "mfg" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"


def compute(period: str):
    path = FIXTURES / f"yield_{period}.csv"
    stations = []
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            total = int(row["total"])
            defects = int(row["defects"])
            yield_pct = (total - defects) / total if total else 0
            stations.append((row["station"], total, defects, yield_pct))
    if not stations:
        raise ValueError("no data")
    fpy = stations[0][3]
    rty = 1.0
    for s in stations:
        rty *= s[3]
    ART_DIR.mkdir(parents=True, exist_ok=True)
    summary = f"FPY: {fpy:.3f}\nRTY: {rty:.3f}\n"
    storage.write(str(ART_DIR / "summary.md"), summary)
    pareto_rows = "station,defects\n" + "\n".join(
        f"{s[0]},{s[2]}" for s in sorted(stations, key=lambda x: x[2], reverse=True)
    )
    pareto_path = ART_DIR / "pareto.csv"
    storage.write(str(pareto_path), pareto_rows)

    record = {"period": period, "fpy": fpy, "rty": rty}
    artifacts.validate_and_write(
        str(ART_DIR / "summary.json"),
        record,
        str(SCHEMA_DIR / "mfg_yield.schema.json"),
    )
    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    lake_path = LAKE_DIR / "mfg_yield.jsonl"
    if lake_path.exists():
        lake_path.unlink()
    storage.write(str(lake_path), record)
    metrics.inc("yield_reported")
    return record
