from __future__ import annotations

import dataclasses
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "legal"
LOG = ART_DIR / "contracts.jsonl"
SEQ_FILE = ART_DIR / "contract_seq.txt"


@dataclass
class Contract:
    id: str
    type: str
    counterparty: str
    version: int = 1
    status: str = "draft"  # draft, review, approved, executed, expired
    effective: str | None = None
    end: str | None = None
    docs: List[str] = field(default_factory=list)
    clauses: List[str] = field(default_factory=list)
    obligations: List[dict] = field(default_factory=list)
    approvals: List[str] = field(default_factory=list)
    signatures: List[str] = field(default_factory=list)


# Helpers -----------------------------------------------------------------

def _log(event: dict) -> None:
    storage.write(str(LOG), json.dumps(event))


def _next_id() -> str:
    last = storage.read(str(SEQ_FILE))
    num = int(last or 0) + 1
    storage.write(str(SEQ_FILE), str(num))
    return f"C{num:03d}"


def _apply(contract: Contract, event: dict) -> Contract:
    action = event.get("action")
    if action == "add_version":
        contract.version = event["version"]
        contract.docs.append(event["doc"])
    elif action == "route":
        contract.status = "review"
    elif action == "approve":
        contract.approvals.append(event["user"])
        contract.status = "approved"
    elif action == "esign":
        contract.signatures.append(event["user"])
    elif action == "execute":
        contract.status = "executed"
        contract.effective = event["date"]
    elif action == "expire":
        contract.status = "expired"
        contract.end = event["date"]
    elif action == "add_obligation":
        contract.obligations.append({"text": event["text"], "due": event["due"]})
    return contract


def load_contract(id: str) -> Contract:
    text = storage.read(str(LOG))
    if not text:
        raise ValueError("no contracts")
    contract: Contract | None = None
    for line in text.splitlines():
        ev = json.loads(line)
        if ev.get("action") == "create" and ev["contract"]["id"] == id:
            contract = Contract(**ev["contract"])
        elif contract and ev.get("id") == id:
            contract = _apply(contract, ev)
    if not contract:
        raise ValueError("contract not found")
    return contract


# API ---------------------------------------------------------------------

def create(type: str, counterparty: str) -> Contract:
    cid = _next_id()
    contract = Contract(id=cid, type=type, counterparty=counterparty)
    _log({"action": "create", "contract": dataclasses.asdict(contract)})
    return contract


def add_version(id: str, doc: str) -> Contract:
    contract = load_contract(id)
    new_version = contract.version + 1
    _log({"action": "add_version", "id": id, "version": new_version, "doc": doc})
    return load_contract(id)


def route_for_review(id: str, to_role: str) -> Contract:
    load_contract(id)
    _log({"action": "route", "id": id, "to": to_role})
    return load_contract(id)


def approve(id: str, as_user: str) -> Contract:
    load_contract(id)
    _log({"action": "approve", "id": id, "user": as_user})
    return load_contract(id)


def esign(id: str, user: str, text: str) -> Contract:
    load_contract(id)
    _log({"action": "esign", "id": id, "user": user, "text": text})
    return load_contract(id)


def execute(id: str, date: str) -> Contract:
    contract = load_contract(id)
    if not contract.approvals or not contract.signatures:
        raise RuntimeError("LEGAL_APPROVALS_MISSING")
    _log({"action": "execute", "id": id, "date": date})
    return load_contract(id)


def expire(id: str, date: str) -> Contract:
    load_contract(id)
    _log({"action": "expire", "id": id, "date": date})
    return load_contract(id)


def add_obligation(id: str, text: str, due: str) -> Contract:
    load_contract(id)
    _log({"action": "add_obligation", "id": id, "text": text, "due": due})
    return load_contract(id)


def all_contracts() -> List[Contract]:
    text = storage.read(str(LOG))
    ids = []
    for line in text.splitlines():
        ev = json.loads(line)
        if ev.get("action") == "create":
            ids.append(ev["contract"]["id"])
    return [load_contract(i) for i in ids]
