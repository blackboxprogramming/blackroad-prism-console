from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Dict

from tools import storage
from licensing import entitlements, sku_packs

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "billing"


def _next_invoice_id() -> str:
    counter_path = ART / "last_invoice_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    storage.write(str(counter_path), str(new))
    return f"INV-{new:04d}"


@dataclass
class LineItem:
    sku: str
    amount: float


@dataclass
class Invoice:
    invoice_id: str
    tenant: str
    period: str
    line_items: List[LineItem]
    subtotal: float
    taxes: float
    total: float


def run(period: str) -> List[Invoice]:
    skus = sku_packs.load_skus()
    ents = entitlements._load()  # type: ignore
    invoices: Dict[str, List[LineItem]] = {}
    for ent in ents:
        if not (ent["start"][:7] <= period <= ent["end"][:7]):
            continue
        price = skus.get(ent["sku"], sku_packs.SkuPack(ent["sku"], [], {}, {"USD":0.0}, [])).price_list.get("USD", 0.0)
        amt = price * ent.get("seats", 0)
        invoices.setdefault(ent["tenant"], []).append(LineItem(ent["sku"], amt))
    results: List[Invoice] = []
    for tenant, items in invoices.items():
        subtotal = sum(i.amount for i in items)
        taxes = round(subtotal * 0.1, 2)
        total = subtotal + taxes
        inv = Invoice(
            invoice_id=_next_invoice_id(),
            tenant=tenant,
            period=period,
            line_items=items,
            subtotal=subtotal,
            taxes=taxes,
            total=total,
        )
        results.append(inv)
    json_path = ART / f"invoices_{period.replace('-', '')}.json"
    storage.write(str(json_path), {"invoices": [asdict(i) for i in results]})
    md_path = ART / f"invoices_{period.replace('-', '')}.md"
    lines = [f"# Invoices {period}"]
    for inv in results:
        lines.append(f"- {inv.invoice_id} {inv.tenant} total={inv.total}")
    storage.write(str(md_path), "\n".join(lines))
    return results


def show(invoice_id: str) -> Dict:
    for path in ART.glob("invoices_*.json"):
        raw = storage.read(str(path))
        data = json.loads(raw).get("invoices", []) if raw else []
        for inv in data:
            if inv["invoice_id"] == invoice_id:
                return inv
    raise ValueError("invoice not found")
