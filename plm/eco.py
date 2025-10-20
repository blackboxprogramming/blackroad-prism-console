import json, os, argparse, time
from typing import Dict, Any, List
from dataclasses import dataclass, asdict
from contextlib import contextmanager

try:
    import fcntl  # type: ignore
except ImportError:  # pragma: no cover - non-posix platforms
    fcntl = None

ART_DIR = os.path.join('artifacts', 'plm', 'changes')
os.makedirs(ART_DIR, exist_ok=True)
COUNTER_FILE = os.path.join(ART_DIR, '.eco_counter')
ALIASES_FILE = os.path.join(ART_DIR, '_aliases.json')


@contextmanager
def _locked_file(path: str):
    fh = open(path, 'a+')
    try:
        if fcntl is not None:
            fcntl.flock(fh, fcntl.LOCK_EX)
        fh.seek(0)
        yield fh
    finally:
        try:
            fh.flush()
            os.fsync(fh.fileno())
        except OSError:
            pass
        if fcntl is not None:
            fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()

@dataclass
class Change:
    id: str
    type: str  # ECR|ECO
    item_id: str
    from_rev: str
    to_rev: str
    reason: str
    risk: str
    status: str  # draft|review|approved|released|rejected
    effects: List[str]
    approvals: List[str]


def _path(cid: str) -> str:
    return os.path.join(ART_DIR, f"{cid}.json")


def _md_path(cid: str) -> str:
    return os.path.join(ART_DIR, f"eco_{cid}.md")


def _next_change_id() -> str:
    os.makedirs(ART_DIR, exist_ok=True)
    with _locked_file(COUNTER_FILE) as fh:
        raw = fh.read().strip()
        current = int(raw) if raw else 0
        current += 1
        fh.seek(0)
        fh.truncate()
        fh.write(str(current))
    return f"ECO-{current:05d}"


def _load_aliases() -> Dict[str, str]:
    if not os.path.exists(ALIASES_FILE):
        return {}
    with open(ALIASES_FILE) as fh:
        try:
            return json.load(fh)
        except json.JSONDecodeError:
            return {}


def _register_alias(alias: str, cid: str):
    if not alias or alias == cid:
        return
    with _locked_file(ALIASES_FILE) as fh:
        data = fh.read().strip()
        aliases = json.loads(data) if data else {}
        if alias in aliases and aliases[alias] != cid:
            return
        aliases[alias] = cid
        fh.seek(0)
        fh.truncate()
        json.dump(aliases, fh, indent=2, sort_keys=True)


def _resolve_cid(cid: str) -> str:
    path = _path(cid)
    if os.path.exists(path):
        return cid
    aliases = _load_aliases()
    target = aliases.get(cid)
    if target and os.path.exists(_path(target)):
        return target
    return cid


def create_change(item_id: str, from_rev: str, to_rev: str, reason: str) -> Change:
    cid = _next_change_id()
    legacy_alias = f"ECO-{int(time.time())%100000:05d}"
    ch = Change(id=cid, type='ECO', item_id=item_id, from_rev=from_rev, to_rev=to_rev,
                reason=reason, risk='medium', status='draft', effects=[item_id], approvals=[])
    with open(_path(cid), 'w') as f:
        json.dump(asdict(ch), f, indent=2, sort_keys=True)
    with open(_md_path(cid), 'w') as f:
        f.write(f"# ECO {cid}\n\nReason: {reason}\n\nItem {item_id} {from_rev}->{to_rev}\n")
    if legacy_alias != cid:
        _register_alias(legacy_alias, cid)
    alias_txt = f" alias={legacy_alias}" if legacy_alias != cid else ""
    print(f"plm_change_created id={cid}{alias_txt} -> {_path(cid)}")
    return ch


def impact(cid: str) -> Dict[str, Any]:
    # Deterministic impact calc: placeholder math
    resolved = _resolve_cid(cid)
    with open(_path(resolved)) as f: ch = json.load(f)
    impact = {
        'cost_delta': 0.00,
        'supply_risk': 'low',
        'routing_touch': True,
    }
    out = {'id': resolved, 'impact': impact}
    print(json.dumps(out, indent=2, sort_keys=True))
    return out


def approve(cid: str, as_user: str):
    resolved = _resolve_cid(cid)
    with open(_path(resolved)) as f: ch = json.load(f)
    if as_user in ch['approvals']:
        pass
    else:
        ch['approvals'].append(as_user)
    ch['status'] = 'approved' if len(ch['approvals'])>=1 else ch['status']
    with open(_path(resolved), 'w') as f: json.dump(ch, f, indent=2, sort_keys=True)
    print(f"plm_change_approved id={resolved} approvals={','.join(ch['approvals'])}")


def release(cid: str):
    # Duty-of-care: check SPC gate (simple flag file)
    spc_flag = os.path.join('artifacts','mfg','spc','blocking.flag')
    if os.path.exists(spc_flag):
        raise SystemExit('DUTY_SPC_UNSTABLE: SPC blocking flag present')
    resolved = _resolve_cid(cid)
    with open(_path(resolved)) as f: ch = json.load(f)
    if ch.get('risk')=='high' and len(ch.get('approvals',[]))<2:
        raise SystemExit('Policy: dual approval required for high risk')
    ch['status']='released'
    with open(_path(resolved),'w') as f: json.dump(ch, f, indent=2, sort_keys=True)
    print(f"plm_changes_released=1 id={resolved}")

# === CLI ===

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
