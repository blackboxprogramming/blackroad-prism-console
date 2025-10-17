from __future__ import annotations

from datetime import datetime
from typing import Dict

from .vendor_registry import Vendor, load_vendors, save_vendors


def _compute_rating(factors: Dict[str, int]) -> str:
    if not factors:
        return "low"
    score = sum(factors.values()) / (len(factors) * 5)
    if score > 0.7:
        return "high"
    if score > 0.3:
        return "medium"
    return "low"


def _lucidia_log(event: Dict) -> None:
    try:
        from lucidia import memory  # type: ignore

        memory.record(event)
    except Exception:
        pass


def update_risk(vendor_id: str, factors: Dict[str, int]) -> Vendor:
    vendors = load_vendors()
    vendor = vendors.get(vendor_id)
    if not vendor:
        raise ValueError("Vendor not found")
    vendor.risk.update(factors)
    vendor.risk_rating = _compute_rating(vendor.risk)
    vendor.audits.append(f"{datetime.utcnow().isoformat()} risk updated")
    vendors[vendor_id] = vendor
    save_vendors(vendors)
    _lucidia_log({"type": "vendor_risk", "vendor": vendor_id, "rating": vendor.risk_rating})
    return vendor


def get_risk(vendor_id: str) -> Dict[str, int]:
    vendors = load_vendors()
    vendor = vendors.get(vendor_id)
    if not vendor:
        raise ValueError("Vendor not found")
    return vendor.risk
