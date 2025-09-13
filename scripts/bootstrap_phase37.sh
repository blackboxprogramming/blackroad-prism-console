#!/usr/bin/env bash
set -euo pipefail

# --- basic project files ---
mkdir -p scripts .github/workflows

if [ ! -f pyproject.toml ]; then
  cat > pyproject.toml <<'PYT'
[project]
name = "blackroad-prism-console"
version = "0.1.0"
requires-python = ">=3.10"
description = "Offline PLM & Manufacturing Ops (Phase 37) — deterministic, file-backed."
readme = "README.md"
authors = [{ name = "Blackroad", email = "eng@blackroadinc.us" }]
dependencies = []

[project.scripts]
brc = "cli.console:main"

[tool.pytest.ini_options]
pythonpath = ["."]
addopts = "-q"
PYT
fi

# --- dirs ---
mkdir -p cli plm mfg utils artifacts/plm artifacts/mfg/{wi,spc,yield,coq,mrp} artifacts/sop fixtures/plm/{items,boms} fixtures/mfg/{routings,spc} contracts/schemas docs tests public content/codex

# ============ cli/console.py ============
cat > cli/console.py <<'PY'
# Deterministic CLI dispatcher supporting "ns:cmd" verbs.
import argparse, sys, importlib

NS_MAP = {
    'plm:items': 'plm.bom',
    'plm:bom': 'plm.bom',
    'plm:eco': 'plm.eco',
    'mfg:wc': 'mfg.routing',
    'mfg:routing': 'mfg.routing',
    'mfg:wi': 'mfg.work_instructions',
    'mfg:spc': 'mfg.spc',
    'mfg:yield': 'mfg.yield',
    'mfg:coq': 'mfg.coq',
    'mfg:mrp': 'mfg.mrp',
}

VERB_FUN = {
    'plm:items:load': 'cli_items_load',
    'plm:bom:load': 'cli_bom_load',
    'plm:bom:explode': 'cli_bom_explode',
    'plm:bom:where-used': 'cli_bom_where_used',
    'plm:eco:new': 'cli_eco_new',
    'plm:eco:impact': 'cli_eco_impact',
    'plm:eco:approve': 'cli_eco_approve',
    'plm:eco:release': 'cli_eco_release',
    'mfg:wc:load': 'cli_wc_load',
    'mfg:routing:load': 'cli_routing_load',
    'mfg:routing:capcheck': 'cli_routing_capcheck',
    'mfg:wi:render': 'cli_wi_render',
    'mfg:spc:analyze': 'cli_spc_analyze',
    'mfg:yield': 'cli_yield',
    'mfg:coq': 'cli_coq',
    'mfg:mrp': 'cli_mrp',
}

def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print("Usage: python -m cli.console <verb> [--flags]\n")
        for k in sorted(VERB_FUN):
            print("  ", k)
        sys.exit(1)
    verb, *rest = argv
    ns = verb.rsplit(':', 1)[0]
    mod_name = NS_MAP.get(ns)
    fun_name = VERB_FUN.get(verb)
    if not (mod_name and fun_name):
        raise SystemExit(f"Unknown verb: {verb}")
    mod = importlib.import_module(mod_name)
    fun = getattr(mod, fun_name)
    fun(rest)

if __name__ == '__main__':
    main()
PY

# ============ plm/bom.py ============
cat > plm/bom.py <<'PY'
from __future__ import annotations
import csv, json, os, argparse
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

ART_DIR = os.path.join('artifacts', 'plm')
ITEMS_PATH = os.path.join(ART_DIR, 'items.json')
BOMS_PATH = os.path.join(ART_DIR, 'boms.json')

os.makedirs(ART_DIR, exist_ok=True)

@dataclass(frozen=True)
class Item:
    id: str
    rev: str
    type: str
    uom: str
    lead_time_days: int
    cost: float
    suppliers: List[str]

@dataclass(frozen=True)
class BOM:
    item_id: str
    rev: str
    lines: List[Dict[str, Any]]

_ITEMS: List[Item] = []
_BOMS: List[BOM] = []


def _load_csv_items(dirpath: str) -> List[Item]:
    items: List[Item] = []
    for name in sorted(os.listdir(dirpath)):
        if not name.endswith('.csv'):
            continue
        with open(os.path.join(dirpath, name), newline='') as f:
            r = csv.DictReader(f)
            for row in r:
                suppliers = [s.strip() for s in row.get('suppliers','').split('|') if s.strip()]
                items.append(Item(
                    id=row['id'].strip(), rev=row['rev'].strip(), type=row['type'].strip(),
                    uom=row['uom'].strip(), lead_time_days=int(row['lead_time_days']),
                    cost=float(row['cost']), suppliers=suppliers))
    items.sort(key=lambda x: (x.id, x.rev))
    return items


def _load_csv_boms(dirpath: str) -> List[BOM]:
    boms: Dict[tuple, List[Dict[str, Any]]] = {}
    for name in sorted(os.listdir(dirpath)):
        if not name.endswith('.csv'):
            continue
        with open(os.path.join(dirpath, name), newline='') as f:
            r = csv.DictReader(f)
            for row in r:
                key = (row['item_id'].strip(), row['rev'].strip())
                boms.setdefault(key, []).append({
                    'component_id': row['component_id'].strip(),
                    'qty': float(row['qty']),
                    'refdes': row.get('refdes','').strip() or None,
                    'scrap_pct': float(row.get('scrap_pct', '0') or 0.0)
                })
    bom_list = [BOM(item_id=k[0], rev=k[1], lines=sorted(v, key=lambda d:(d['component_id'], d.get('refdes') or '')))
                for k,v in sorted(boms.items())]
    return bom_list


def save_catalogs(items: List[Item], boms: List[BOM]):
    with open(ITEMS_PATH, 'w') as f:
        json.dump([asdict(i) for i in items], f, indent=2, sort_keys=True)
    with open(BOMS_PATH, 'w') as f:
        json.dump([asdict(b) for b in boms], f, indent=2, sort_keys=True)


def load_items(dirpath: str):
    global _ITEMS
    _ITEMS = _load_csv_items(dirpath)
    save_catalogs(_ITEMS, _BOMS)


def load_boms(dirpath: str):
    global _BOMS
    _BOMS = _load_csv_boms(dirpath)
    save_catalogs(_ITEMS, _BOMS)


def explode(item_id: str, rev: str, level: int = 99) -> List[Dict[str, Any]]:
    bom_map = {(b.item_id, b.rev): b for b in _BOMS}
    out = []
    def walk(it, rv, qty, lvl):
        if lvl>level:
            return
        b = bom_map.get((it, rv))
        if not b:
            return
        for line in b.lines:
            row = {
                'parent_id': it, 'parent_rev': rv,
                'component_id': line['component_id'], 'qty': qty*line['qty'],
                'level': lvl
            }
            out.append(row)
            walk(line['component_id'], _pick_latest_rev(line['component_id']), qty*line['qty'], lvl+1)
    walk(item_id, rev, 1.0, 1)
    out.sort(key=lambda r:(r['level'], r['parent_id'], r['component_id']))
    return out


def where_used(component_id: str) -> List[Dict[str, str]]:
    uses = []
    for b in _BOMS:
        for line in b.lines:
            if line['component_id']==component_id:
                uses.append({'item_id': b.item_id, 'rev': b.rev})
    uses.sort(key=lambda r:(r['item_id'], r['rev']))
    return uses


def _pick_latest_rev(item_id: str) -> str:
    revs = [i.rev for i in _ITEMS if i.id==item_id]
    return sorted(set(revs))[-1] if revs else 'A'

# CLI

def cli_items_load(argv):
    p = argparse.ArgumentParser(prog='plm:items:load')
    p.add_argument('--dir', required=True)
    a = p.parse_args(argv)
    load_items(a.dir)
    print(f"plm_items_written={len(_ITEMS)} -> {ITEMS_PATH}")


def cli_bom_load(argv):
    p = argparse.ArgumentParser(prog='plm:bom:load')
    p.add_argument('--dir', required=True)
    a = p.parse_args(argv)
    load_boms(a.dir)
    print(f"plm_boms_written={len(_BOMS)} -> {BOMS_PATH}")


def cli_bom_explode(argv):
    p = argparse.ArgumentParser(prog='plm:bom:explode')
    p.add_argument('--item', required=True)
    p.add_argument('--rev', required=True)
    p.add_argument('--level', type=int, default=3)
    a = p.parse_args(argv)
    rows = explode(a.item, a.rev, a.level)
    for r in rows:
        print(f"L{r['level']} {r['parent_id']}->{r['component_id']} x{r['qty']:.3f}")

def cli_bom_where_used(argv):
    p = argparse.ArgumentParser(prog='plm:bom:where-used')
    p.add_argument('--component', required=True)
    a = p.parse_args(argv)
    rows = where_used(a.component)
    for r in rows:
        print(f"{r['item_id']}@{r['rev']}")
PY

# ============ plm/eco.py ============
cat > plm/eco.py <<'PY'
import json, os, argparse, time
from typing import Dict, Any, List
from dataclasses import dataclass, asdict

ART_DIR = os.path.join('artifacts', 'plm', 'changes')
os.makedirs(ART_DIR, exist_ok=True)

@dataclass
class Change:
    id: str
    type: str  # ECR|ECO
    item_id: str
    from_rev: str
    to_rev: str
    reason: str
    risk: str
    status: str
    effects: List[str]
    approvals: List[str]


def _path(cid: str) -> str:
    return os.path.join(ART_DIR, f"{cid}.json")

def _md_path(cid: str) -> str:
    return os.path.join(ART_DIR, f"eco_{cid}.md")


def create_change(item_id: str, from_rev: str, to_rev: str, reason: str) -> Change:
    cid = f"ECO-{int(time.time())%100000:05d}"
    ch = Change(id=cid, type='ECO', item_id=item_id, from_rev=from_rev, to_rev=to_rev,
                reason=reason, risk='medium', status='draft', effects=[item_id], approvals=[])
    with open(_path(cid), 'w') as f:
        json.dump(asdict(ch), f, indent=2, sort_keys=True)
    with open(_md_path(cid), 'w') as f:
        f.write(f"# ECO {cid}\n\nReason: {reason}\n\nItem {item_id} {from_rev}->{to_rev}\n")
    print(f"plm_change_created id={cid} -> {_path(cid)}")
    return ch


def impact(cid: str) -> Dict[str, Any]:
    with open(_path(cid)) as f: ch = json.load(f)
    impact = {'cost_delta': 0.00, 'supply_risk': 'low', 'routing_touch': True}
    out = {'id': cid, 'impact': impact}
    print(json.dumps(out, indent=2, sort_keys=True))
    return out


def approve(cid: str, as_user: str):
    with open(_path(cid)) as f: ch = json.load(f)
    if as_user not in ch['approvals']:
        ch['approvals'].append(as_user)
    ch['status'] = 'approved' if len(ch['approvals'])>=1 else ch['status']
    with open(_path(cid), 'w') as f: json.dump(ch, f, indent=2, sort_keys=True)
    print(f"plm_change_approved id={cid} approvals={','.join(ch['approvals'])}")


def release(cid: str):
    spc_flag = os.path.join('artifacts','mfg','spc','blocking.flag')
    if os.path.exists(spc_flag):
        raise SystemExit('DUTY_SPC_UNSTABLE: SPC blocking flag present')
    with open(_path(cid)) as f: ch = json.load(f)
    if ch.get('risk')=='high' and len(ch.get('approvals',[]))<2:
        raise SystemExit('Policy: dual approval required for high risk')
    # Supplier dual-source policy for critical items
    critical_list_path = os.path.join('fixtures','plm','critical_items.txt')
    if os.path.exists(critical_list_path):
        crit = {line.strip() for line in open(critical_list_path) if line.strip()}
    else:
        crit = set()
    if ch['item_id'] in crit:
        items_path = os.path.join('artifacts','plm','items.json')
        if os.path.exists(items_path):
            items = json.load(open(items_path))
            rec = next((i for i in items if i['id']==ch['item_id'] and i['rev']==ch['to_rev']), None)
            if not rec or len(rec.get('suppliers',[])) < 2:
                raise SystemExit('Policy: dual-source required for critical items')
    ch['status']='released'
    with open(_path(cid),'w') as f: json.dump(ch, f, indent=2, sort_keys=True)
    print(f"plm_changes_released=1 id={cid}")

# CLI

def cli_eco_new(argv):
    p = argparse.ArgumentParser(prog='plm:eco:new')
    p.add_argument('--item', required=True)
    p.add_argument('--from', dest='from_rev', required=True)
    p.add_argument('--to', dest='to_rev', required=True)
    p.add_argument('--reason', required=True)
    a = p.parse_args(argv)
    create_change(a.item, a.from_rev, a.to_rev, a.reason)

def cli_eco_impact(argv):
    p = argparse.ArgumentParser(prog='plm:eco:impact')
    p.add_argument('--id', required=True)
    a = p.parse_args(argv)
    impact(a.id)

def cli_eco_approve(argv):
    p = argparse.ArgumentParser(prog='plm:eco:approve')
    p.add_argument('--id', required=True)
    p.add_argument('--as-user', required=True)
    a = p.parse_args(argv)
    approve(a.id, a.as_user)

def cli_eco_release(argv):
    p = argparse.ArgumentParser(prog='plm:eco:release')
    p.add_argument('--id', required=True)
    a = p.parse_args(argv)
    release(a.id)
PY

# ============ mfg/routing.py ============
cat > mfg/routing.py <<'PY'
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
PY

# ============ mfg/mrp.py ============
cat > mfg/mrp.py <<'PY'
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
    with open(out_path, 'w') as f:
        json.dump(plan, f, indent=2, sort_keys=True)
    print(f"mrp_planned={len(plan)} -> {out_path}")
    return plan

# CLI

def cli_mrp(argv):
    p = argparse.ArgumentParser(prog='mfg:mrp')
    p.add_argument('--demand', required=True)
    p.add_argument('--inventory', required=True)
    p.add_argument('--pos', required=True)
    a = p.parse_args(argv)
    plan(a.demand, a.inventory, a.pos)
PY

# ============ mfg/work_instructions.py ============
cat > mfg/work_instructions.py <<'PY'
import os, argparse
from datetime import datetime

ART_DIR = os.path.join('artifacts','mfg','wi')
os.makedirs(ART_DIR, exist_ok=True)

HTML_HEAD = """<meta charset='utf-8'><style>body{font-family:ui-monospace,monospace;max-width:720px;margin:2rem auto;line-height:1.5}</style>"""


def render(item: str, rev: str, routing: dict | None = None):
    # DUTY_REV_MISMATCH simple check (expect routing file with same rev)
    routing_dir = os.path.join('fixtures','mfg','routings')
    expected_yaml = os.path.join(routing_dir, f"{item}_{rev}.yaml")
    if not os.path.exists(expected_yaml):
        raise SystemExit("DUTY_REV_MISMATCH: routing & BOM revs mismatch or missing routing fixture")

    fname_md = os.path.join(ART_DIR, f"{item}_{rev}.md")
    fname_html = os.path.join(ART_DIR, f"{item}_{rev}.html")
    md = f"""# Work Instructions — {item} rev {rev}\n\n- Revision: {rev}\n- Generated: {datetime.utcnow().isoformat()}Z\n\n## Safety\n- ESD protection required.\n\n## Steps\n1. Kitting per MRP.\n2. Assemble per routing.\n3. Torque per table.\n"""
    with open(fname_md,'w') as f: f.write(md)
    with open(fname_html,'w') as f: f.write(HTML_HEAD+md.replace('\n','<br/>'))
    print(f"wi_rendered=1 -> {fname_md}")

# CLI

def cli_wi_render(argv):
    p = argparse.ArgumentParser(prog='mfg:wi:render')
    p.add_argument('--item', required=True)
    p.add_argument('--rev', required=True)
    a = p.parse_args(argv)
    render(a.item, a.rev, None)
PY

# ============ mfg/spc.py ============
cat > mfg/spc.py <<'PY'
import csv, os, json, argparse, math

ART_DIR = os.path.join('artifacts','mfg','spc')
os.makedirs(ART_DIR, exist_ok=True)

RULE_POINT_BEYOND_3SIG = 'SPC_POINT_BEYOND_3SIG'
RULE_TREND_7 = 'SPC_TREND_7'
RULE_RUN_8_ONE_SIDE = 'SPC_RUN_8_ONE_SIDE'


def _mean(xs): return sum(xs)/len(xs) if xs else 0.0

def _stdev(xs):
    if len(xs)<2: return 0.0
    m = _mean(xs)
    var = sum((x-m)**2 for x in xs)/(len(xs)-1)
    return math.sqrt(var)


def analyze(op: str, window: int, csv_dir='fixtures/mfg/spc'):
    path = os.path.join(csv_dir, f"{op}_sample.csv")
    xs = []
    with open(path, newline='') as f:
        r = csv.DictReader(f)
        for row in r:
            xs.append(float(row['measure']))
    xs = xs[-window:]
    m = _mean(xs); s = _stdev(xs)
    ucl = m + 3*s; lcl = m - 3*s
    findings = []
    for i,x in enumerate(xs):
        if s>0 and (x>ucl or x<lcl): findings.append({'i':i,'rule':RULE_POINT_BEYOND_3SIG})
    if len(xs)>=7:
        inc = all(xs[i]<xs[i+1] for i in range(len(xs)-1))
        dec = all(xs[i]>xs[i+1] for i in range(len(xs)-1))
        if inc or dec: findings.append({'i':len(xs)-1,'rule':RULE_TREND_7})
    if s>0 and len(xs)>=8:
        above = [x>m for x in xs]
        run = 1; ok=False
        for i in range(1,len(above)):
            run = run+1 if above[i]==above[i-1] else 1
            if run>=8: ok=True; break
        if ok: findings.append({'i':i,'rule':RULE_RUN_8_ONE_SIDE})
    fjson = os.path.join(ART_DIR, 'findings.json')
    with open(fjson,'w') as f: json.dump({'op':op,'m':m,'s':s,'ucl':ucl,'lcl':lcl,'findings':findings}, f, indent=2, sort_keys=True)
    fmd = os.path.join(ART_DIR, 'charts.md')
    with open(fmd,'w') as f:
        f.write(f"# SPC {op}\n\nmean={m:.4f} s={s:.4f} UCL={ucl:.4f} LCL={lcl:.4f}\n\n")
        for x in xs:
            f.write('|'+'#'*max(1,int(10*(x-m)/(s+1e-9)+10))+'\n')
    # blocking flag on any 3σ breach
    flag_path = os.path.join(ART_DIR, 'blocking.flag')
    if any(f['rule']==RULE_POINT_BEYOND_3SIG for f in findings):
        with open(flag_path,'w') as _f: _f.write('SPC_BLOCK')
    else:
        if os.path.exists(flag_path): os.remove(flag_path)
    print(f"spc_findings={len(findings)} -> {fjson}")

# CLI

def cli_spc_analyze(argv):
    p = argparse.ArgumentParser(prog='mfg:spc:analyze')
    p.add_argument('--op', required=True)
    p.add_argument('--window', type=int, default=50)
    a = p.parse_args(argv)
    analyze(a.op, a.window)
PY

# ============ mfg/yield.py ============
cat > mfg/yield.py <<'PY'
import os, argparse
ART_DIR = os.path.join('artifacts','mfg','yield')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    fpy = 0.97; rty = 0.94
    with open(os.path.join(ART_DIR,'summary.md'),'w') as f:
        f.write(f"# Yield {period}\n\nFPY={fpy:.3f}\nRTY={rty:.3f}\n")
    with open(os.path.join(ART_DIR,'pareto.csv'),'w') as f:
        f.write('defect,count\nSolder bridge,12\nMissing screw,7\nLabel skew,3\n')
    print("yield_reported=1")

# CLI

def cli_yield(argv):
    p = argparse.ArgumentParser(prog='mfg:yield')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
PY

# ============ mfg/coq.py ============
cat > mfg/coq.py <<'PY'
import os, argparse
ART_DIR = os.path.join('artifacts','mfg','coq')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    rows = [
        ('Prevention',1200.0),('Appraisal',800.0),('Internal Failure',450.0),('External Failure',150.0)
    ]
    with open(os.path.join(ART_DIR,'coq.csv'),'w') as f:
        f.write('bucket,amount\n')
        for b,a in rows: f.write(f"{b},{a}\n")
    with open(os.path.join(ART_DIR,'coq.md'),'w') as f:
        total = sum(a for _,a in rows)
        f.write(f"# COQ {period}\n\nTotal={total:.2f}\n")
    print("coq_built=1")

# CLI

def cli_coq(argv):
    p = argparse.ArgumentParser(prog='mfg:coq')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
PY

# ============ utils/metrics.py (optional placeholder) ============
cat > utils/metrics.py <<'PY'
import json, os, time
METRICS_PATH = os.path.join('artifacts','metrics.json')
os.makedirs('artifacts', exist_ok=True)

def emit(name: str, value=1):
    data = {}
    if os.path.exists(METRICS_PATH):
        try:
            data = json.load(open(METRICS_PATH))
        except Exception:
            data = {}
    data[name] = data.get(name, 0) + value
    data['last_updated'] = int(time.time())
    with open(METRICS_PATH,'w') as f: json.dump(data, f, indent=2, sort_keys=True)
PY

# ============ Schemas ============
cat > contracts/schemas/plm_items.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"array","items":{"type":"object","additionalProperties":false,"required":["id","rev","type","uom","lead_time_days","cost","suppliers"],"properties":{"id":{"type":"string","pattern":"^[A-Z0-9_-]+$"},"rev":{"type":"string","pattern":"^[A-Z][A-Z0-9]*$"},"type":{"enum":["assembly","component","raw"]},"uom":{"type":"string","minLength":1},"lead_time_days":{"type":"integer","minimum":0,"maximum":3650},"cost":{"type":"number","minimum":0},"suppliers":{"type":"array","items":{"type":"string"},"minItems":0}}}}
JSON

cat > contracts/schemas/plm_boms.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"array","items":{"type":"object","additionalProperties":false,"required":["item_id","rev","lines"],"properties":{"item_id":{"type":"string"},"rev":{"type":"string","pattern":"^[A-Z][A-Z0-9]*$"},"lines":{"type":"array","minItems":1,"items":{"type":"object","additionalProperties":false,"required":["component_id","qty"],"properties":{"component_id":{"type":"string"},"qty":{"type":"number","exclusiveMinimum":0},"refdes":{"type":["string","null"]},"scrap_pct":{"type":["number","null"],"minimum":0,"maximum":50}}}}}}
JSON

cat > contracts/schemas/plm_changes.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":true,"required":["id","type","item_id","from_rev","to_rev","status","approvals"],"properties":{"id":{"type":"string","pattern":"^ECO-[0-9]{5}$"},"type":{"enum":["ECR","ECO"]},"item_id":{"type":"string"},"from_rev":{"type":"string"},"to_rev":{"type":"string"},"reason":{"type":"string"},"risk":{"enum":["low","medium","high"]},"status":{"enum":["draft","review","approved","released","rejected"]},"effects":{"type":"array","items":{"type":"string"}},"approvals":{"type":"array","items":{"type":"string"}}}}
JSON

cat > contracts/schemas/mfg_routings.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","required":["item","rev","steps"],"properties":{"item":{"type":"string"},"rev":{"type":"string","pattern":"^[A-Z][A-Z0-9]*$"},"steps":{"type":"array","items":{"type":"object","required":["wc","op","std_time_min"],"properties":{"wc":{"type":"string"},"op":{"type":"string"},"std_time_min":{"type":"number","minimum":0},"yield_pct":{"type":["number","string"],"minimum":0,"maximum":100}}}}}}
JSON

cat > contracts/schemas/mfg_spc.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":false,"required":["op","m","s","ucl","lcl","findings"],"properties":{"op":{"type":"string"},"m":{"type":"number"},"s":{"type":"number","minimum":0},"ucl":{"type":"number"},"lcl":{"type":"number"},"findings":{"type":"array","items":{"type":"object","required":["i","rule"],"properties":{"i":{"type":"integer","minimum":0},"rule":{"type":"string"}}}}}}
JSON

cat > contracts/schemas/mfg_yield.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","required":["period"],"properties":{"period":{"type":"string","pattern":"^[0-9]{4}-(0[1-9]|1[0-2])$"},"fpy":{"type":"number","minimum":0,"maximum":1},"rty":{"type":"number","minimum":0,"maximum":1}}}
JSON

cat > contracts/schemas/mfg_mrp.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":{"type":"object","required":["planned_qty","release_day_offset","kitting_list"],"properties":{"planned_qty":{"type":"number","exclusiveMinimum":0},"release_day_offset":{"type":"integer","minimum":0},"kitting_list":{"type":"array","items":{"type":"string"},"minItems":1}}}}
JSON

cat > contracts/schemas/mfg_coq.schema.json <<'JSON'
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"array","items":{"type":"object","additionalProperties":false,"required":["bucket","amount"],"properties":{"bucket":{"enum":["Prevention","Appraisal","Internal Failure","External Failure"]},"amount":{"type":"number","minimum":0}}}}
JSON

# ============ Fixtures ============
cat > fixtures/plm/items/items_sample.csv <<'CSV'
id,rev,type,uom,lead_time_days,cost,suppliers
PROD-100,A,assembly,ea,15,25.00,SUP-ACME|SUP-GLOBAL
COMP-001,A,component,ea,10,2.50,SUP-ACME
RAW-101,A,raw,kg,5,1.20,SUP-RAW
CSV

cat > fixtures/plm/boms/boms_sample.csv <<'CSV'
item_id,rev,component_id,qty,refdes,scrap_pct
PROD-100,A,COMP-001,2,,0
COMP-001,A,RAW-101,0.1,,1
CSV

cat > fixtures/mfg/work_centers.csv <<'CSV'
id,name,capacity_per_shift,skills,cost_rate
WC-ASM,Assembly Cell,480,assemble|solder,25
WC-TEST,Test Bench,240,test,30
CSV

cat > fixtures/mfg/routings/PROD-100_B.yaml <<'YAML'
item: PROD-100
rev: B
steps:
  - wc: WC-ASM, op: OP-100, std_time_min: 6.0, yield_pct: 98
  - wc: WC-TEST, op: OP-200, std_time_min: 3.0, yield_pct: 99
YAML

cat > fixtures/mfg/spc/OP-200_sample.csv <<'CSV'
ts,measure
2025-09-01T00:00:00Z,1.01
2025-09-02T00:00:00Z,1.02
2025-09-03T00:00:00Z,0.98
2025-09-04T00:00:00Z,1.00
2025-09-05T00:00:00Z,0.99
CSV

cat > artifacts/sop/allocations.csv <<'CSV'
item_id,qty
PROD-100,20
CSV

# ============ Tests (minimal) ============
cat > tests/test_bom.py <<'PY'
from plm import bom

def test_explode():
    bom._ITEMS = [bom.Item('PROD-100','A','assembly','ea',0,0.0,[]), bom.Item('COMP-001','A','component','ea',0,0.0,[])]
    bom._BOMS = [bom.BOM('PROD-100','A',[{'component_id':'COMP-001','qty':2}])]
    rows = bom.explode('PROD-100','A', level=2)
    assert any(r['component_id']=='COMP-001' for r in rows)
PY

cat > tests/test_mrp.py <<'PY'
from mfg import mrp
import os, json

def test_mrp_plan(tmp_path, monkeypatch):
    d = tmp_path
    dem = d/'demand.csv'; dem.write_text('item_id,qty\nA,10\nB,2\n')
    inv = d/'inv.csv'; inv.write_text('item_id,qty\nA,8\n')
    pos = d/'pos.csv'; pos.write_text('item_id,qty_open\nB,2\n')
    monkeypatch.setattr(mrp, 'ART_DIR', str(d/'mrp'))
    out = mrp.plan(str(dem), str(inv), str(pos))
    assert 'A' in out and out['A']['planned_qty'] == 2
    assert 'B' not in out
    assert os.path.exists(os.path.join(mrp.ART_DIR, 'plan.json'))
PY

cat > tests/test_spc.py <<'PY'
from mfg import spc

def test_basic_stats():
    xs = [1,1,1,1,1,1,1,5]
    assert spc._mean(xs) > 0
    assert spc._stdev(xs) >= 0
PY

# ============ CI workflow ============
cat > .github/workflows/ci.yml <<'YML'
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: python -m pip install -U pip pytest jsonschema
      - run: python -m pip install -e .
      - name: Unit tests
        run: pytest -q
      - name: Demo run (deterministic)
        run: |
          python -m cli.console plm:items:load --dir fixtures/plm/items
          python -m cli.console plm:bom:load --dir fixtures/plm/boms
          python -m cli.console mfg:wc:load --file fixtures/mfg/work_centers.csv
          python -m cli.console mfg:routing:load --dir fixtures/mfg/routings
          python -m cli.console mfg:routing:capcheck --item PROD-100 --rev B --qty 1000
          python -m cli.console mfg:wi:render --item PROD-100 --rev B
          python -m cli.console mfg:spc:analyze --op OP-200 --window 50
          python -m cli.console mfg:yield --period 2025-09
          python -m cli.console mfg:mrp --demand artifacts/sop/allocations.csv --inventory fixtures/mfg/inventory.csv --pos fixtures/mfg/open_pos.csv
          python -m cli.console mfg:coq --period 2025-Q3
YML

chmod +x scripts/bootstrap_phase37.sh

echo "Bootstrap complete. Try: \n  python -m pip install -e . && pytest -q && brc plm:items:load --dir fixtures/plm/items && brc plm:bom:load --dir fixtures/plm/boms && brc plm:bom:explode --item PROD-100 --rev A --level 2"
