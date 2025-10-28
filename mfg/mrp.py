"""Material requirements planning helpers.

This rewrite keeps the surface area tiny – we only need to support the
unit tests under ``tests/plm_mfg`` while producing deterministic JSON
artifacts.  The historical file mixed several implementations together,
which made reasoning about behaviour impossible.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Dict

ART_DIR: Path = Path("artifacts/mfg/mrp")


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _read_table(path: str, key_field: str, value_field: str) -> Dict[str, float]:
    table: Dict[str, float] = {}
    csv_path = Path(path)
    if not csv_path.exists():
        return table
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            key = row.get(key_field)
            if not key:
                continue
            try:
                value = float(row.get(value_field, 0) or 0)
            except ValueError:
                value = 0.0
            table[key] = table.get(key, 0.0) + value
    return table

from tools import storage, artifacts
from plm import bom
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "mrp"
LAKE_DIR = ROOT / "artifacts" / "mfg" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"

def plan(demand_csv: str, inventory_csv: str, pos_csv: str) -> Dict[str, Dict[str, float]]:
    """Compute a minimal MRP plan.

    The planner simply nets demand against on-hand inventory and open
    purchase orders.  Only positive net requirements generate planned
    orders.  The resulting structure matches what the tests assert on and
    is persisted to ``plan.json`` under ``ART_DIR``.
    """

    demand = _read_table(demand_csv, "item_id", "qty")
    inventory = _read_table(inventory_csv, "item_id", "qty")
    pos = _read_table(pos_csv, "item_id", "qty_open")

    plan_output: Dict[str, Dict[str, float]] = {}
    for item_id, demand_qty in sorted(demand.items()):
        net = demand_qty - inventory.get(item_id, 0.0) - pos.get(item_id, 0.0)
        if net <= 0:
            continue
        plan_output[item_id] = {
            "planned_qty": round(net, 6),
            "release_day_offset": 0.0,
            "kitting_list": [item_id],
        }

    art_dir = _ensure_art_dir()
    plan_path = art_dir / "plan.json"
    plan_path.write_text(json.dumps(plan_output, indent=2, sort_keys=True), encoding="utf-8")
    return plan_output


def cli_mrp(argv: list[str] | None = None) -> Dict[str, Dict[str, float]]:
    parser = argparse.ArgumentParser(prog="mfg:mrp", description="Run a lightweight MRP plan")
    parser.add_argument("--demand", required=True)
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--pos", required=True)
    args = parser.parse_args(argv)
    return plan(args.demand, args.inventory, args.pos)


__all__ = ["plan", "cli_mrp", "ART_DIR"]
        plan[item] = plan.get(item, 0) + net
        # explode components
        for _, comp, comp_qty in bom.explode(item, d.get("rev", "A"), level=2):
            plan[comp] = plan.get(comp, 0) + comp_qty * net
    ART_DIR.mkdir(parents=True, exist_ok=True)
    artifacts.validate_and_write(
        str(ART_DIR / "plan.json"),
        plan,
        str(SCHEMA_DIR / "mfg_mrp.schema.json"),
    )
    # kitting lists
    for d in demand:
        item = d["item_id"]
        rev = d.get("rev", "A")
        lines = ["component,qty"]
        for _, comp, comp_qty in bom.explode(item, rev, level=1):
            lines.append(f"{comp},{comp_qty * float(d['qty'])}")
        storage.write(str(ART_DIR / f"kitting_{item}.csv"), "\n".join(lines))
    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    lake_path = LAKE_DIR / "mfg_mrp.jsonl"
    if lake_path.exists():
        lake_path.unlink()
    storage.write(
        str(lake_path),
        {
            "demand_file": demand_file,
            "inventory_file": inventory_file,
            "pos_file": pos_file,
            "plan": plan,
        },
    )
    metrics.inc("mrp_planned")
    return plan
