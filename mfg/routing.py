from __future__ import annotations

import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List

import yaml

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg"


@dataclass
class WorkCenter:
    id: str
    name: str
    capacity_per_shift: int
    skills: str
    cost_rate: float  # per hour


@dataclass
class RoutingStep:
    wc: str
    op: str
    std_time_min: float
    yield_pct: float
    instructions_path: str | None = None


@dataclass
class Routing:
    item_rev: str
    steps: List[RoutingStep]


WORK_CENTERS: Dict[str, WorkCenter] = {}
ROUTINGS: Dict[str, Routing] = {}


def load_work_centers(file: str) -> Dict[str, WorkCenter]:
    wcs: Dict[str, WorkCenter] = {}
    with open(file, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            wc = WorkCenter(
                id=row["id"],
                name=row["name"],
                capacity_per_shift=int(row["capacity_per_shift"]),
                skills=row.get("skills", ""),
                cost_rate=float(row.get("cost_rate", 0)),
            )
            wcs[wc.id] = wc
    global WORK_CENTERS
    WORK_CENTERS = wcs
    ART_DIR.mkdir(parents=True, exist_ok=True)
    storage.write(str(ART_DIR / "work_centers.json"), json.dumps([asdict(w) for w in wcs.values()], indent=2))
    return wcs


def load_routings(directory: str) -> Dict[str, Routing]:
    rts: Dict[str, Routing] = {}
    for path in Path(directory).glob("*.yaml"):
        data = yaml.safe_load(path.read_text())
        steps = [RoutingStep(**s) for s in data.get("steps", [])]
        rt = Routing(item_rev=data["item_rev"], steps=steps)
        rts[rt.item_rev] = rt
    global ROUTINGS
    ROUTINGS = rts
    ART_DIR.mkdir(parents=True, exist_ok=True)
    storage.write(str(ART_DIR / "routings.json"), json.dumps([{"item_rev": r.item_rev, "steps": [asdict(s) for s in r.steps]} for r in rts.values()], indent=2))
    return rts


def capacity_check(item: str, rev: str, qty: int):
    key = f"{item}_{rev}"
    rt = ROUTINGS.get(key)
    if not rt:
        raise ValueError("routing not found")
    totals: Dict[str, float] = {}
    for step in rt.steps:
        mins = qty * step.std_time_min / (step.yield_pct or 1)
        totals[step.wc] = totals.get(step.wc, 0.0) + mins
    results = {}
    labor_cost = 0.0
    for wc_id, req in totals.items():
        wc = WORK_CENTERS.get(wc_id)
        cap = (wc.capacity_per_shift * 60) if wc else 0
        results[wc_id] = {"required_min": req, "capacity_min": cap}
        if wc:
            labor_cost += (req / 60) * wc.cost_rate
    results["labor_cost"] = labor_cost
    return results
