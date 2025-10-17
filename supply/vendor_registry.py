from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List

VENDORS_FILE = Path(__file__).with_name("vendors.json")


@dataclass
class Vendor:
    id: str
    category: str
    approvals: List[str] = field(default_factory=list)
    audits: List[str] = field(default_factory=list)
    risk_rating: str = "unknown"
    risk: Dict[str, int] = field(default_factory=dict)


def _load_raw() -> Dict[str, Dict]:
    if not VENDORS_FILE.exists():
        return {}
    return json.loads(VENDORS_FILE.read_text())


def load_vendors() -> Dict[str, Vendor]:
    data = _load_raw()
    return {vid: Vendor(**info) for vid, info in data.items()}


def save_vendors(vendors: Dict[str, Vendor]) -> None:
    VENDORS_FILE.write_text(json.dumps({vid: asdict(v) for vid, v in vendors.items()}, indent=2))


def upsert_vendor(vendor: Vendor) -> None:
    vendors = load_vendors()
    vendors[vendor.id] = vendor
    save_vendors(vendors)


def list_vendors() -> List[Vendor]:
    return list(load_vendors().values())


def get_vendor(vendor_id: str) -> Vendor | None:
    return load_vendors().get(vendor_id)


def record_audit(vendor_id: str, note: str) -> None:
    vendors = load_vendors()
    vendor = vendors.get(vendor_id)
    if not vendor:
        raise ValueError("Vendor not found")
    vendor.audits.append(f"{datetime.utcnow().isoformat()} {note}")
    save_vendors(vendors)
