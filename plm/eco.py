from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import List

from orchestrator import metrics
from tools import artifacts, storage

from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List

from tools import storage
from . import bom

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm" / "changes"
SCHEMA = ROOT / "contracts" / "schemas" / "plm_change.schema.json"
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

def _save(ch: Change) -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    artifacts.validate_and_write(str(_path(ch.id)), asdict(ch), str(SCHEMA))
    # simple markdown log for humans
    artifacts.validate_and_write(
        str(ART_DIR / f"eco_{ch.id}.md"),
        f"# {ch.id}\nstatus: {ch.status}\nreason: {ch.reason}\n",
    )
    storage.write(str(_path(ch.id)), json.dumps(asdict(ch)))
    # simple markdown log
    storage.write(str(ART_DIR / f"eco_{ch.id}.md"), f"# {ch.id}\nstatus: {ch.status}\nreason: {ch.reason}\n")


def new_change(item_id: str, from_rev: str, to_rev: str, reason: str, risk: str = "low") -> Change:
    cid = _next_id()
    ch = Change(id=cid, type="ECO", item_id=item_id, from_rev=from_rev, to_rev=to_rev, reason=reason, risk=risk)
    _save(ch)
    metrics.inc("plm_changes_created")
    return ch


def impact(change_id: str) -> float:
    ch = _load(change_id)
    bom.ensure_loaded()

    def _cost(item_id: str, rev: str) -> float:
        itm = bom.get_item(item_id, rev)
        if itm:
            return itm.cost
        return 0.0

    return _cost(ch.item_id, ch.to_rev) - _cost(ch.item_id, ch.from_rev)
    items = bom.ITEMS or json.loads(storage.read(str(bom.ART_DIR / "items.json")))
    def _get_cost(item_id, rev):
        if isinstance(items, dict):
            itm = items.get((item_id, rev))
            if itm:
                return itm.cost
            # when loaded from json list
        for itm in items if isinstance(items, list) else []:
            if itm["id"] == item_id and itm["rev"] == rev:
                return itm["cost"]
        return 0.0
    return _get_cost(ch.item_id, ch.to_rev) - _get_cost(ch.item_id, ch.from_rev)


def approve(change_id: str, user: str) -> Change:
    ch = _load(change_id)
    if user not in ch.approvals:
        ch.approvals.append(user)
    # simple rule: high risk requires two approvals
    required = 2 if ch.risk == "high" else 1
    if len(ch.approvals) >= required:
        ch.status = "approved"
        metrics.inc("plm_changes_approved")
    _save(ch)
    return ch


def _spc_unstable(item_id: str) -> bool:
    flag = ROOT / "artifacts" / "mfg" / "spc" / "blocking.flag"
    if flag.exists():
        return True
    report_path = ROOT / "artifacts" / "mfg" / "spc" / "report.json"
    if not report_path.exists():
        return False
    data = storage.read(str(report_path))
    if not data:
        return False
    report = json.loads(data)
    return bool(report.get("unstable") or report.get("findings"))
    findings = ROOT / "artifacts" / "mfg" / "spc" / "findings.json"
    if not findings.exists():
        return False
    data = json.loads(storage.read(str(findings)) or "[]")
    return bool(data)


def release(change_id: str) -> Change:
    ch = _load(change_id)
    if ch.status != "approved":
        raise RuntimeError("not approved")
    if _spc_unstable(ch.item_id):
        raise RuntimeError("DUTY_SPC_UNSTABLE")
    ch.status = "released"
    _save(ch)
    metrics.inc("plm_changes_released")
    return ch

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
