"""Certificate renewal utilities for Codex-30 Registrar."""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timedelta
from typing import Dict, MutableMapping

DEFAULT_RENEW_WINDOW_DAYS = 21


def should_renew(certificate: Dict[str, str], today: date | None = None, *, renew_window: int = DEFAULT_RENEW_WINDOW_DAYS) -> bool:
    """Return ``True`` if the certificate should be renewed."""

    today = today or date.today()
    expires_on = date.fromisoformat(certificate["expires_on"])
    return expires_on - today <= timedelta(days=renew_window)


def _fingerprint(payload: Dict[str, str]) -> str:
    digest = hashlib.sha256(repr(sorted(payload.items())).encode("utf-8")).hexdigest()
    return digest


def renew(
    domain: str,
    store: MutableMapping[str, Dict[str, str]],
    *,
    today: date | None = None,
    renew_window: int = DEFAULT_RENEW_WINDOW_DAYS,
) -> Dict[str, str | bool]:
    """Renew the certificate if required and return renewal metadata."""

    today = today or date.today()
    record = store.get(domain)
    if not record:
        return {"renewed": False, "reason": "missing"}

    if not should_renew(record, today, renew_window=renew_window):
        return {"renewed": False, "reason": "not_due"}

    new_fingerprint = hashlib.sha256(f"{domain}:{today.isoformat()}".encode("utf-8")).hexdigest()
    record.update(
        {
            "fingerprint": new_fingerprint,
            "renewed_at": datetime.utcnow().isoformat() + "Z",
        }
    )
    receipt = {
        "topic": "cert_renewal",
        "reference": domain,
        "hash": _fingerprint(record),
        "issued_at": datetime.utcnow().isoformat() + "Z",
    }
    record["receipt"] = receipt
    store[domain] = record
    return {"renewed": True, "fingerprint": new_fingerprint, "receipt": receipt}


def pin_fingerprint(record: Dict[str, str]) -> str:
    """Return a pin string for dashboards and deploy guards."""

    return f"{record['domain']}:{record['fingerprint']}"


__all__ = ["DEFAULT_RENEW_WINDOW_DAYS", "pin_fingerprint", "renew", "should_renew"]
