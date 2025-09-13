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
                'release_day_offset': 0,  # deterministic, lead-time calc can be added later
                'kitting_list': [item]
            }
    out_path = os.path.join(ART_DIR, 'plan.json')
    with open(out_path, 'w') as f:
        json.dump(plan, f, indent=2, sort_keys=True)
    print(f"mrp_planned={len(plan)} -> {out_path}")
    return plan

# === CLI ===

def cli_mrp(argv):
    p = argparse.ArgumentParser(prog='mfg:mrp')
    p.add_argument('--demand', required=True)
    p.add_argument('--inventory', required=True)
    p.add_argument('--pos', required=True)
    a = p.parse_args(argv)
    plan(a.demand, a.inventory, a.pos)
