from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import date
from pathlib import Path
from typing import List, Dict, Optional

from tools import storage
from . import sku_packs, keys

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "licensing" / "entitlements.json"


@dataclass
class Entitlement:
    sku: str
    seats: int
    features: List[str]
    start: str
    end: str
    tenant: str


def _load() -> List[Dict]:
    raw = storage.read(str(ARTIFACTS))
    return json.loads(raw).get("entitlements", []) if raw else []


def _save(ents: List[Dict]) -> None:
    storage.write(str(ARTIFACTS), {"entitlements": ents})


def add_entitlement(tenant: str, sku: str, seats: int, start: str, end: str) -> Entitlement:
    skus = sku_packs.load_skus()
    features = skus[sku].features if sku in skus else []
    ent = Entitlement(sku=sku, seats=seats, features=features, start=start, end=end, tenant=tenant)
    ents = _load()
    ents.append(asdict(ent))
    _save(ents)
    return ent


def add_from_key(key_str: str) -> Entitlement:
    payload = keys.verify_key(key_str)
    return add_entitlement(
        tenant=payload["tenant"],
        sku=payload["sku"],
        seats=payload["seats"],
        start=payload["start"],
        end=payload["end"],
    )


def resolve(tenant: str, on: Optional[str] = None) -> Dict:
    if on:
        today = date.fromisoformat(on)
    else:
        today = date.today()
    feats: List[str] = []
    seats = 0
    for ent in _load():
        if ent["tenant"] != tenant:
            continue
        if date.fromisoformat(ent["start"]) <= today <= date.fromisoformat(ent["end"]):
            seats += ent.get("seats", 0)
            for f in ent.get("features", []):
                if f not in feats:
                    feats.append(f)
    return {"tenant": tenant, "features": feats, "seats": seats}
