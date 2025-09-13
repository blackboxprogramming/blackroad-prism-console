from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "yield"
FIXTURES = ROOT / "fixtures" / "mfg"


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
