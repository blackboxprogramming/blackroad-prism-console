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
