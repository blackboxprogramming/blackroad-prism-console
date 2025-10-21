from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List

from tools import storage
from . import catalog
from licensing import sku_packs, entitlements

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "partners" / "orders.json"


@dataclass
class Order:
    id: str
    tenant: str
    listing_id: str
    qty: int
    status: str


def _load_orders() -> List[Dict]:
    raw = storage.read(str(ART))
    return json.loads(raw) if raw else []


def _save_orders(orders: List[Dict]) -> None:
    import json

    storage.write(str(ART), json.dumps(orders))


def _next_id() -> str:
    counter_path = ART.parent / "last_order_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    storage.write(str(counter_path), str(new))
    return f"O{new:04d}"


def place_order(tenant: str, listing_id: str, qty: int) -> Order:
    cat = catalog._load_catalog_from_artifacts()
    listing = next((l for l in cat.get("listings", []) if l["id"] == listing_id), None)
    if not listing or listing.get("status") != "active":
        raise ValueError("POLICY_LISTING_BLOCKED")
    skus = sku_packs.load_skus()
    deps = skus.get(listing["sku"], sku_packs.SkuPack(listing["sku"], [], {}, {}, [])).dependencies
    resolved = entitlements.resolve(tenant)
    have = {e["sku"] for e in entitlements._load() if e["tenant"] == tenant}
    for dep in deps:
        if dep not in have:
            raise ValueError("POLICY_LISTING_BLOCKED")
    order = Order(id=_next_id(), tenant=tenant, listing_id=listing_id, qty=qty, status="pending")
    orders = _load_orders()
    orders.append(asdict(order))
    _save_orders(orders)
    return order


def provision(order_id: str) -> Order:
    orders = _load_orders()
    for order in orders:
        if order["id"] == order_id:
            if order["status"] != "pending":
                return Order(**order)
            cat = catalog._load_catalog_from_artifacts()
            listing = next((l for l in cat.get("listings", []) if l["id"] == order["listing_id"]), None)
            entitlements.add_entitlement(order["tenant"], listing["sku"], order["qty"], "2025-01-01", "2025-12-31")
            order["status"] = "provisioned"
            _save_orders(orders)
            return Order(**order)
    raise ValueError("order not found")
