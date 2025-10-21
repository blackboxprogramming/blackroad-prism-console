from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List

from orchestrator import metrics
from tools import artifacts
from typing import Dict

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "yield"
FIXTURES = ROOT / "fixtures" / "mfg"
SCHEMA = ROOT / "contracts" / "schemas" / "mfg_yield.schema.json"


def compute(period: str):
    path = FIXTURES / f"yield_{period}.csv"
    stations: List[Dict[str, float]] = []
    stations = []
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            total = int(row["total"])
            defects = int(row["defects"])
            yield_pct = (total - defects) / total if total else 0
            stations.append(
                {
                    "station": row["station"],
                    "total": total,
                    "defects": defects,
                    "yield_pct": yield_pct,
                }
            )
    if not stations:
        raise ValueError("no data")
    fpy = stations[0]["yield_pct"]
    rty = 1.0
    for s in stations:
        rty *= s["yield_pct"]
    ART_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "period": period,
        "fpy": fpy,
        "rty": rty,
        "stations": stations,
        "pareto": [
            {"station": s["station"], "defects": s["defects"]}
            for s in sorted(stations, key=lambda x: x["defects"], reverse=True)
        ],
    }
    artifacts.validate_and_write(str(ART_DIR / "summary.json"), report, str(SCHEMA))
    artifacts.validate_and_write(
        str(ART_DIR / "summary.md"), f"FPY: {fpy:.3f}\nRTY: {rty:.3f}\n"
    )
    artifacts.validate_and_write(
        str(ART_DIR / "pareto.csv"),
        "station,defects\n"
        + "\n".join(f"{row['station']},{row['defects']}" for row in report["pareto"]),
    )
    metrics.inc("yield_reported")
    return report
            stations.append((row["station"], total, defects, yield_pct))
    if not stations:
        raise ValueError("no data")
    fpy = stations[0][3]
    rty = 1.0
    for s in stations:
        rty *= s[3]
    ART_DIR.mkdir(parents=True, exist_ok=True)
    storage.write(
        str(ART_DIR / "summary.md"),
        f"FPY: {fpy:.3f}\nRTY: {rty:.3f}\n",
    )
    pareto_path = ART_DIR / "pareto.csv"
    storage.write(
        str(pareto_path),
        "station,defects\n" + "\n".join(f"{s[0]},{s[2]}" for s in sorted(stations, key=lambda x: x[2], reverse=True)),
    )
    return {"fpy": fpy, "rty": rty}
