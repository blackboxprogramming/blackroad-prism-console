from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List

from orchestrator import metrics
from plm import bom
from tools import artifacts

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "mrp"
SCHEMA = ROOT / "contracts" / "schemas" / "mfg_mrp_plan.schema.json"
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
    report = {
        "demand_source": demand_file,
        "inventory_source": inventory_file,
        "pos_source": pos_file,
        "planned": plan,
    }
    artifacts.validate_and_write(str(ART_DIR / "plan.json"), report, str(SCHEMA))
    storage.write(str(ART_DIR / "plan.json"), json.dumps(plan, indent=2))
    # kitting lists
    for d in demand:
        item = d["item_id"]
        rev = d.get("rev", "A")
        lines = ["component,qty"]
        for _, comp, comp_qty in bom.explode(item, rev, level=1):
            lines.append(f"{comp},{comp_qty * float(d['qty'])}")
        artifacts.validate_and_write(str(ART_DIR / f"kitting_{item}.csv"), "\n".join(lines))
    metrics.inc("mrp_planned")
    return report
        storage.write(str(ART_DIR / f"kitting_{item}.csv"), "\n".join(lines))
import csv, os, json, argparse
from typing import Dict, Any

ART_DIR = os.path.join('artifacts','mfg','mrp')
os.makedirs(ART_DIR, exist_ok=True)


def _read_rows(path: str) -> list[dict]:
    if not os.path.exists(path): return []
    with open(path, newline='') as f:
        return list(csv.DictReader(f))


def plan(demand_csv: str, inventory_csv: str, pos_csv: str) -> Dict[str, Any]:
    demand = {}
    for r in _read_rows(demand_csv):
        demand[r['item_id']] = demand.get(r['item_id'], 0.0) + float(r['qty'])
    inv = {}
    for r in _read_rows(inventory_csv):
        inv[r['item_id']] = inv.get(r['item_id'], 0.0) + float(r['qty'])
    pos = {}
    for r in _read_rows(pos_csv):
        pos[r['item_id']] = pos.get(r['item_id'], 0.0) + float(r['qty_open'])

    plan: Dict[str, Any] = {}
    for item, need in sorted(demand.items()):
        net = round(need - inv.get(item,0.0) - pos.get(item,0.0), 6)
        if net > 0:
            plan[item] = {
                'planned_qty': net,
                'release_day_offset': 0,
                'kitting_list': [item]
            }
    out_path = os.path.join(ART_DIR, 'plan.json')
    os.makedirs(ART_DIR, exist_ok=True)
                'release_day_offset': 0,  # deterministic, lead-time calc can be added later
                'kitting_list': [item]
            }
    out_path = os.path.join(ART_DIR, 'plan.json')
    with open(out_path, 'w') as f:
        json.dump(plan, f, indent=2, sort_keys=True)
    print(f"mrp_planned={len(plan)} -> {out_path}")
    return plan

# CLI
# === CLI ===

def cli_mrp(argv):
    p = argparse.ArgumentParser(prog='mfg:mrp')
    p.add_argument('--demand', required=True)
    p.add_argument('--inventory', required=True)
    p.add_argument('--pos', required=True)
    a = p.parse_args(argv)
    plan(a.demand, a.inventory, a.pos)
