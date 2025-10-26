"""Certificate renewal helpers."""

from __future__ import annotations

import datetime as dt
import hashlib
from pathlib import Path
from typing import Dict, Optional

import yaml

CONFIG_PATH = Path(__file__).resolve().parents[1] / "codex30.yaml"


def _load_config(path: Path = CONFIG_PATH) -> Dict[str, object]:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def renew(
    domain: str,
    cert_info: Optional[Dict[str, object]] = None,
    *,
    today: Optional[dt.date] = None,
) -> Dict[str, object]:
    """Simulate renewing a certificate if it is within the renewal window."""

    config = _load_config()
    renew_window = int(config.get("certs", {}).get("renew_at_days", 21))
    today = today or dt.date.today()

    if cert_info is None:
        raise ValueError("cert_info metadata is required for renewal checks")

    expires_on = cert_info.get("expires_on")
    if isinstance(expires_on, str):
        expires = dt.date.fromisoformat(expires_on)
    elif isinstance(expires_on, dt.date):
        expires = expires_on
    else:
        raise ValueError("expires_on must be ISO date string or datetime.date")

    fingerprint = cert_info.get("fingerprint", "")
    remaining = (expires - today).days
    result: Dict[str, object] = {
        "domain": domain,
        "fingerprint": fingerprint,
        "expires_on": expires.isoformat(),
        "days_remaining": remaining,
        "renewed": False,
    }

    if remaining <= renew_window:
        renewed_at = dt.datetime.combine(today, dt.time(0, 0), tzinfo=dt.timezone.utc)
        new_fp = hashlib.sha256(f"{domain}{renewed_at.isoformat()}".encode("utf-8")).hexdigest()
        result.update({
            "renewed": True,
            "fingerprint": new_fp,
            "renewed_at": renewed_at.isoformat(),
        })

    return result
