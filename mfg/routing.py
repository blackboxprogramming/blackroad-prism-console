from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List

import yaml

from orchestrator import metrics
from tools import artifacts, storage

try:  # optional strict validation
    import jsonschema
except Exception:  # pragma: no cover
    jsonschema = None

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg"
SCHEMA_DIR = ROOT / "contracts" / "schemas"
WC_SCHEMA = SCHEMA_DIR / "mfg_work_centers.schema.json"
ROUTING_SCHEMA = SCHEMA_DIR / "mfg_routings.schema.json"
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
    artifacts.validate_and_write(
        str(ART_DIR / "work_centers.json"),
        [asdict(w) for w in wcs.values()],
        str(WC_SCHEMA),
    )
    metrics.inc("mfg_work_centers_loaded", len(wcs) or 1)
    storage.write(
        str(ART_DIR / "work_centers.json"),
        json.dumps([asdict(w) for w in wcs.values()], indent=2),
    )
    return wcs


def load_routings(directory: str, strict: bool = False) -> Dict[str, Routing]:
    rts: Dict[str, Routing] = {}
    schema = None
    if strict and jsonschema:
        schema_path = ROOT / "schemas" / "routing.schema.json"
        try:
            schema = json.loads(storage.read(str(schema_path)))
        except Exception:
            schema = None
    for path in Path(directory).glob("*.yaml"):
        data = yaml.safe_load(path.read_text())
        if schema and jsonschema:
            jsonschema.validate(data, schema)
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
    artifacts.validate_and_write(
        str(ART_DIR / "routings.json"),
        [{"item_rev": r.item_rev, "steps": [asdict(s) for s in r.steps]} for r in rts.values()],
        str(ROUTING_SCHEMA),
    )
    metrics.inc("mfg_routings_loaded", len(rts) or 1)
    storage.write(str(ART_DIR / "routings.json"), json.dumps([{"item_rev": r.item_rev, "steps": [asdict(s) for s in r.steps]} for r in rts.values()], indent=2))
    storage.write(
        str(ART_DIR / "routings.json"),
        json.dumps(
            [
                {"item_rev": r.item_rev, "steps": [asdict(s) for s in r.steps]}
                for r in rts.values()
            ],
            indent=2,
        ),
    )
    return rts


def capacity_check(item: str, rev: str, qty: int):
    _ensure_loaded()
    key = f"{item}_{rev}"
    rt = ROUTINGS.get(key)
    if not rt:
        raise ValueError("routing not found")
    totals: Dict[str, float] = {}
    for step in rt.steps:
        mins = qty * step.std_time_min / (step.yield_pct or 1)
        totals[step.wc] = totals.get(step.wc, 0.0) + mins
    results: Dict[str, Dict[str, float]] = {}
    results = {}
    labor_cost = 0.0
    for wc_id, req in totals.items():
        wc = WORK_CENTERS.get(wc_id)
        cap = (wc.capacity_per_shift * 60) if wc else 0
        results[wc_id] = {"required_min": req, "capacity_min": cap}
        if wc:
            labor_cost += (req / 60) * wc.cost_rate
    results["labor_cost"] = labor_cost
    metrics.inc("routing_cap_checked")
    return results


def _ensure_loaded() -> None:
    global WORK_CENTERS, ROUTINGS
    if not WORK_CENTERS:
        data = storage.read(str(ART_DIR / "work_centers.json"))
        if data:
            rows = json.loads(data)
            WORK_CENTERS = {row["id"]: WorkCenter(**row) for row in rows}
    if not ROUTINGS:
        data = storage.read(str(ART_DIR / "routings.json"))
        if data:
            rows = json.loads(data)
            ROUTINGS = {
                row["item_rev"]: Routing(
                    item_rev=row["item_rev"],
                    steps=[RoutingStep(**s) for s in row.get("steps", [])],
                )
                for row in rows
            }


def get_routing(item: str, rev: str) -> Routing | None:
    _ensure_loaded()
    return ROUTINGS.get(f"{item}_{rev}")
    return results
import csv, os, json, argparse
from typing import Dict, Any, List

ART_DIR = os.path.join('artifacts','mfg')
os.makedirs(ART_DIR, exist_ok=True)

WC_DB: Dict[str, Dict[str, Any]] = {}
ROUT_DB: Dict[str, Dict[str, Any]] = {}

def _key(item: str, rev: str) -> str:
    return f"{item}_{rev}"

def load_work_centers(csv_file: str):
    global WC_DB
    with open(csv_file, newline='') as f:
        r = csv.DictReader(f)
        for row in r:
            WC_DB[row['id']] = {
                'name': row['name'],
                'capacity_per_shift': float(row['capacity_per_shift']),
                'skills': [s.strip() for s in row.get('skills','').split('|') if s.strip()],
                'cost_rate': float(row['cost_rate'])
            }
    print(f"work_centers_loaded={len(WC_DB)} -> {csv_file}")

def _parse_simple_yaml(path: str) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    steps: List[Dict[str, Any]] = []
    with open(path) as f:
        for raw in f:
            line = raw.rstrip('\n')
            if not line or line.strip().startswith('#'): continue
            if line.strip().startswith('- '):
                kvs = line.strip()[2:]
                step: Dict[str, Any] = {}
                for part in kvs.split(','):
                    if ':' not in part: continue
                    k,v = [p.strip() for p in part.split(':',1)]
                    step[k]= float(v) if k=='std_time_min' else v
                steps.append(step)
                continue
            if ':' in line and not line.startswith(' '):
                k,v = [p.strip() for p in line.split(':',1)]
                data[k]=v
            if line.strip()=='steps:':
                pass
    if steps:
        data['steps']=steps
    return data

def load_routings(dirpath: str):
    global ROUT_DB
    for name in sorted(os.listdir(dirpath)):
        if not (name.endswith('.yaml') or name.endswith('.yml')):
            continue
        p = os.path.join(dirpath, name)
        rt = _parse_simple_yaml(p)
        key = _key(rt['item'], rt['rev'])
        ROUT_DB[key] = rt
    print(f"routings_loaded={len(ROUT_DB)} from {dirpath}")

def capcheck(item: str, rev: str, qty: int):
    key = _key(item, rev)
    rt = ROUT_DB.get(key)
    if not rt:
        raise SystemExit('routing not found')
    labor_cost = 0.0
import csv, os, json, argparse
from typing import Dict, Any, List

ART_DIR = os.path.join('artifacts','mfg')
os.makedirs(ART_DIR, exist_ok=True)

WC_DB: Dict[str, Dict[str, Any]] = {}
ROUT_DB: Dict[str, Dict[str, Any]] = {}  # key: item_rev -> routing dict


def _key(item: str, rev: str) -> str:
    return f"{item}_{rev}"


def load_work_centers(csv_file: str):
    global WC_DB
    with open(csv_file, newline='') as f:
        r = csv.DictReader(f)
        for row in r:
            WC_DB[row['id']] = {
                'name': row['name'],
                'capacity_per_shift': float(row['capacity_per_shift']),
                'skills': [s.strip() for s in row.get('skills','').split('|') if s.strip()],
                'cost_rate': float(row['cost_rate'])
            }
    print(f"work_centers_loaded={len(WC_DB)} -> {csv_file}")


def _parse_simple_yaml(path: str) -> Dict[str, Any]:
    # Minimal subset parser: expects simple key: value and list under steps:
    data: Dict[str, Any] = {}
    steps: List[Dict[str, Any]] = []
    cur_list = None
    with open(path) as f:
        for raw in f:
            line = raw.rstrip('\n')
            if not line or line.strip().startswith('#'):
                continue
            if line.strip().startswith('- '):
                # step item
                kvs = line.strip()[2:]
                step: Dict[str, Any] = {}
                for part in kvs.split(','):
                    k,v = [p.strip() for p in part.split(':',1)]
                    step[k]= v if k!='std_time_min' else float(v)
                steps.append(step)
                continue
            if ':' in line and not line.startswith(' '):
                k,v = [p.strip() for p in line.split(':',1)]
                data[k]=v
            if line.strip()=='steps:':
                cur_list = steps
    if steps:
        data['steps']=steps
    return data


def load_routings(dirpath: str):
    global ROUT_DB
    for name in sorted(os.listdir(dirpath)):
        if not (name.endswith('.yaml') or name.endswith('.yml')):
            continue
        p = os.path.join(dirpath, name)
        rt = _parse_simple_yaml(p)
        key = _key(rt['item'], rt['rev'])
        ROUT_DB[key] = rt
    print(f"routings_loaded={len(ROUT_DB)} from {dirpath}")


def capcheck(item: str, rev: str, qty: int):
    key = _key(item, rev)
    rt = ROUT_DB.get(key)
    if not rt:
        raise SystemExit('routing not found')
    labor_cost = 0.0
    bottleneck = None
    for s in rt['steps']:
        wc = WC_DB[s['wc']]
        std = float(s['std_time_min'])
        yld = float(s.get('yield_pct', '100') or 100) / 100.0
        labor_cost += (std/60.0) * wc['cost_rate'] * qty
        cap = wc['capacity_per_shift']
        need = (qty / max(yld, 1e-6)) * (std/60.0)
        util = need / max(cap, 1e-9)
        if (bottleneck is None) or (util > bottleneck[2]):
            bottleneck = (s['wc'], s.get('op','OP'), util)
    out = {
        'item_rev': key,
        'theoretical_labor_cost': round(labor_cost,2),
        'bottleneck_wc': bottleneck[0] if bottleneck else None,
        'bottleneck_util': round(bottleneck[2],3) if bottleneck else 0.0
    }
    print(json.dumps(out, indent=2, sort_keys=True))
    return out

# CLI
# Very small MRP-lite placeholder (explosion delegated to PLM if needed later)

def mrp_plan(demand_csv: str, inv_csv: str, pos_csv: str) -> Dict[str, Any]:
    def read_sum(path, key='qty'):
        if not os.path.exists(path):
            return {}
        out = {}
        with open(path, newline='') as f:
            r = csv.DictReader(f)
            for row in r:
                out[row['item_id']] = out.get(row['item_id'], 0) + float(row[key])
        return out
    demand = read_sum(demand_csv)
    inv = read_sum(inv_csv)
    pos = read_sum(pos_csv, key='qty_open')
    plan = {}
    for item, need in sorted(demand.items()):
        net = need - inv.get(item,0) - pos.get(item,0)
        if net>0:
            plan[item] = {'planned': net, 'kit_list':[item]}
    art = os.path.join(ART_DIR,'mrp','plan.json')
    os.makedirs(os.path.dirname(art), exist_ok=True)
    with open(art,'w') as f:
        json.dump(plan, f, indent=2, sort_keys=True)
    print(f"mrp_planned={len(plan)} -> {art}")
    return plan

# === CLI ===

def cli_wc_load(argv):
    p = argparse.ArgumentParser(prog='mfg:wc:load')
    p.add_argument('--file', required=True)
    a = p.parse_args(argv)
    load_work_centers(a.file)


def cli_routing_load(argv):
    p = argparse.ArgumentParser(prog='mfg:routing:load')
    p.add_argument('--dir', required=True)
    a = p.parse_args(argv)
    load_routings(a.dir)


def cli_routing_capcheck(argv):
    p = argparse.ArgumentParser(prog='mfg:routing:capcheck')
    p.add_argument('--item', required=True)
    p.add_argument('--rev', required=True)
    p.add_argument('--qty', type=int, required=True)
    a = p.parse_args(argv)
    capcheck(a.item, a.rev, a.qty)


def cli_mrp(argv):
    p = argparse.ArgumentParser(prog='mfg:mrp')
    p.add_argument('--demand', required=True)
    p.add_argument('--inventory', required=True)
    p.add_argument('--pos', required=True)
    a = p.parse_args(argv)
    mrp_plan(a.demand, a.inventory, a.pos)
