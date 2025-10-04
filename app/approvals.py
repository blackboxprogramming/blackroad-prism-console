from __future__ import annotations

import time
from typing import Any, Dict, Optional, Set
from uuid import uuid4

_store: Dict[str, Dict[str, Any]] = {}


def create_request(actor: str, payload: Dict[str, Any], ttl_seconds: int) -> Dict[str, Any]:
    rid = str(uuid4())
    _store[rid] = {
        "id": rid,
        "actor": actor,
        "payload": payload,
        "created_at": time.time(),
        "ttl": ttl_seconds,
        "approvers": set(),
        "granted": False,
    }
    return _store[rid]


def approve(rid: str, approver: str, require_distinct: bool = True) -> Dict[str, Any]:
    req = _store.get(rid)
    if not req:
        raise KeyError("not_found")
    if time.time() > req["created_at"] + req["ttl"]:
        raise ValueError("expired")
    if require_distinct and approver in (req["approvers"] | {req["actor"]}):
        raise ValueError("must_be_distinct")
    req["approvers"].add(approver)
    if len(req["approvers"]) >= 2:
        req["granted"] = True
    return req


def get(rid: str) -> Optional[Dict[str, Any]]:
    return _store.get(rid)


def reset_store() -> None:
    _store.clear()
