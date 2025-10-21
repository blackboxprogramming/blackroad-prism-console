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


@dataclass
class Change:
    id: str
    type: str  # ECR or ECO
    item_id: str
    from_rev: str
    to_rev: str
    reason: str
    risk: str = "low"
    status: str = "draft"  # draft|review|approved|released|rejected
    effects: List[str] = field(default_factory=list)
    approvals: List[str] = field(default_factory=list)


def _next_id() -> str:
    counter = ART_DIR / "_counter.txt"
    last = int(storage.read(str(counter)) or 0)
    new = last + 1
    storage.write(str(counter), str(new))
    return f"ECO-{new:03d}"


def _path(id: str) -> Path:
    return ART_DIR / f"{id}.json"


def _load(id: str) -> Change:
    data = json.loads(storage.read(str(_path(id))))
    return Change(**data)


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
