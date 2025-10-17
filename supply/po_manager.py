from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List

PO_DIR = Path(__file__).with_name("po")


@dataclass
class POItem:
    sku: str
    qty: int
    cost: float


@dataclass
class PurchaseOrder:
    id: str
    vendor: str
    items: List[POItem]
    status: str = "draft"
    created_at: str = datetime.utcnow().isoformat()

    def total(self) -> float:
        return sum(i.qty * i.cost for i in self.items)


def _po_path(po_id: str) -> Path:
    return PO_DIR / f"{po_id}.json"


def _load_po(po_id: str) -> PurchaseOrder:
    data = json.loads(_po_path(po_id).read_text())
    data["items"] = [POItem(**i) for i in data["items"]]
    return PurchaseOrder(**data)


def _save_po(po: PurchaseOrder) -> None:
    PO_DIR.mkdir(exist_ok=True)
    _po_path(po.id).write_text(
        json.dumps({**asdict(po), "items": [asdict(i) for i in po.items]}, indent=2)
    )


def create_po(vendor: str, items: List[Dict]) -> PurchaseOrder:
    PO_DIR.mkdir(exist_ok=True)
    po_id = f"PO{int(datetime.utcnow().timestamp())}"
    po_items = [POItem(**i) for i in items]
    po = PurchaseOrder(id=po_id, vendor=vendor, items=po_items)
    _save_po(po)
    return po


def approve_po(po_id: str) -> PurchaseOrder:
    po = _load_po(po_id)
    po.status = "approved"
    _save_po(po)
    return po


def receive_po(po_id: str) -> PurchaseOrder:
    po = _load_po(po_id)
    po.status = "received"
    _save_po(po)
    return po


def close_po(po_id: str) -> PurchaseOrder:
    po = _load_po(po_id)
    po.status = "closed"
    _save_po(po)
    return po


def export_po_pdf(po_id: str, out_path: Path) -> None:
    po = _load_po(po_id)
    out_path.write_text(json.dumps(asdict(po), indent=2))
