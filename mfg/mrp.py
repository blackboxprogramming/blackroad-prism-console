from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List

from tools import storage
from plm import bom

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "mrp"


def _read_csv(path: str) -> List[Dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return list(reader)


def plan(demand_file: str, inventory_file: str, pos_file: str):
    demand = _read_csv(demand_file)
    inventory = {r["item_id"]: float(r["qty"]) for r in _read_csv(inventory_file)}
    pos = {r["item_id"]: float(r["qty"]) for r in _read_csv(pos_file)}
    plan: Dict[str, float] = {}
    for d in demand:
        item = d["item_id"]
        qty = float(d["qty"])
        net = qty - inventory.get(item, 0) - pos.get(item, 0)
        if net <= 0:
            continue
        plan[item] = plan.get(item, 0) + net
        # explode components
        for _, comp, comp_qty in bom.explode(item, d.get("rev", "A"), level=2):
            plan[comp] = plan.get(comp, 0) + comp_qty * net
    ART_DIR.mkdir(parents=True, exist_ok=True)
    storage.write(str(ART_DIR / "plan.json"), json.dumps(plan, indent=2))
    # kitting lists
    for d in demand:
        item = d["item_id"]
        rev = d.get("rev", "A")
        lines = ["component,qty"]
        for _, comp, comp_qty in bom.explode(item, rev, level=1):
            lines.append(f"{comp},{comp_qty * float(d['qty'])}")
        storage.write(str(ART_DIR / f"kitting_{item}.csv"), "\n".join(lines))
    return plan
