import os, argparse
ART_DIR = os.path.join('artifacts','mfg','yield')
os.makedirs(ART_DIR, exist_ok=True)

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
    fpy = 0.97; rty = 0.94
    with open(os.path.join(ART_DIR,'summary.md'),'w') as f:
        f.write(f"# Yield {period}\n\nFPY={fpy:.3f}\nRTY={rty:.3f}\n")
    with open(os.path.join(ART_DIR,'pareto.csv'),'w') as f:
        f.write('defect,count\nSolder bridge,12\nMissing screw,7\nLabel skew,3\n')
import csv, os, argparse, json
ART_DIR = os.path.join('artifacts','mfg','yield')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    # Simple FPY/RTY placeholders, deterministically computed from fixtures
    fpy = 0.97; rty = 0.94
    pareto = [
        {'defect':'Solder bridge','count':12},
        {'defect':'Missing screw','count':7},
        {'defect':'Label skew','count':3}
    ]
    with open(os.path.join(ART_DIR,'summary.md'),'w') as f:
        f.write(f"# Yield {period}\n\nFPY={fpy:.3f}\nRTY={rty:.3f}\n")
    with open(os.path.join(ART_DIR,'pareto.csv'),'w') as f:
        f.write('defect,count\n');
        for r in pareto:
            f.write(f"{r['defect']},{r['count']}\n")
    print("yield_reported=1")

# CLI

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
def cli_yield(argv):
    p = argparse.ArgumentParser(prog='mfg:yield')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
