import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List

import yaml


@dataclass
class ReviewPacket:
    employee: str
    level: str
    ratings: Dict[str, int]
    notes: str = ""


def new_cycle(cycle_id: str, config_yaml: Path, demographics_csv: Path, out_dir: Path) -> List[ReviewPacket]:
    cfg = yaml.safe_load(config_yaml.read_text())
    employees = []
    with demographics_csv.open() as f:
        for row in csv.DictReader(f):
            employees.append(row)
    packets = [ReviewPacket(e["employee_id"], e["level"], {c: 3 for c in cfg.get("competencies", ["impact"])} ) for e in employees]
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "packets.json").write_text(json.dumps([asdict(p) for p in packets], indent=2))
    return packets


def calibrate(cycle_dir: Path) -> Dict[str, int]:
    data = json.loads((cycle_dir / "packets.json").read_text())
    counts = {}
    for p in data:
        for comp, rating in p["ratings"].items():
            counts.setdefault(comp, {}).setdefault(rating, 0)
            counts[comp][rating] += 1
    # write table
    lines = ["comp,rating,count"]
    for comp, ratings in counts.items():
        for r, c in sorted(ratings.items()):
            lines.append(f"{comp},{r},{c}")
    (cycle_dir / "calibration_table.csv").write_text("\n".join(lines))
    (cycle_dir / "summary.md").write_text("Calibration complete")
    return counts
