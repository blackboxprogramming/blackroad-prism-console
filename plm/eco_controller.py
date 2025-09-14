from __future__ import annotations

"""Engineering change request/order controller.

This module provides a small offline API surface that mimics REST
endpoints for creating and approving engineering change orders.  Each
record is stored as a JSON artifact with a hash for auditability.
"""

from dataclasses import dataclass, asdict
from pathlib import Path
import datetime as _dt
import hashlib
import json
from typing import Dict

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm" / "eco"
MEMORY_LOG = ROOT / "artifacts" / "lucidia" / "memory.jsonl"


@dataclass
class ECO:
    id: str
    bom_id: str
    reason: str
    change_set: Dict[str, str]
    status: str = "pending"
    approver: str | None = None
    created_at: str = _dt.datetime.utcnow().isoformat()
    approved_at: str | None = None

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


def _next_id() -> str:
    counter = ART_DIR / "_counter.txt"
    last = int(storage.read(str(counter)) or 0)
    new = last + 1
    storage.write(str(counter), str(new))
    return f"ECO-{new:05d}"


def _path(eid: str) -> Path:
    return ART_DIR / f"{eid}.json"


def _write_with_hash(path: Path, text: str) -> None:
    storage.write(str(path), text)
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    storage.write(str(path.with_suffix(path.suffix + ".sha256")), digest)


def _log_memory(event: Dict[str, str]) -> None:
    storage.write(str(MEMORY_LOG), event)


def create_eco(bom_id: str, reason: str, change_set: Dict[str, str]) -> ECO:
    eid = _next_id()
    eco = ECO(id=eid, bom_id=bom_id, reason=reason, change_set=change_set)
    ART_DIR.mkdir(parents=True, exist_ok=True)
    _write_with_hash(_path(eid), eco.to_json())
    _log_memory({"type": "ECO_CREATE", "id": eid, "reason": reason})
    return eco


def approve_eco(eid: str, approver: str) -> ECO:
    data = json.loads(storage.read(str(_path(eid))) or "{}")
    if not data:
        raise FileNotFoundError(f"ECO {eid} not found")
    eco = ECO(**data)
    eco.status = "approved"
    eco.approver = approver
    eco.approved_at = _dt.datetime.utcnow().isoformat()
    _write_with_hash(_path(eid), eco.to_json())
    _log_memory({"type": "ECO_APPROVE", "id": eid, "approver": approver})
    return eco


# Simple CLI for manual testing -------------------------------------------------

if __name__ == "__main__":
    import argparse
    import sys

    p = argparse.ArgumentParser(prog="plmctl eco")
    sub = p.add_subparsers(dest="cmd")
    c_new = sub.add_parser("create")
    c_new.add_argument("--bom", required=True)
    c_new.add_argument("--reason", required=True)
    c_new.add_argument("--change", required=True, help="JSON change set")
    c_appr = sub.add_parser("approve")
    c_appr.add_argument("--id", required=True)
    c_appr.add_argument("--approver", required=True)
    args = p.parse_args(sys.argv[1:])

    if args.cmd == "create":
        change_set = json.loads(args.change)
        eco = create_eco(args.bom, args.reason, change_set)
        print(eco.to_json())
    elif args.cmd == "approve":
        eco = approve_eco(args.id, args.approver)
        print(eco.to_json())
    else:
        p.print_help()
