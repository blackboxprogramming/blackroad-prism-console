"""Certificate renewal reflex."""

from __future__ import annotations

import datetime as dt
from typing import Dict

from ..pipelines.cert_watch import renew


def handle_cert_check(domain: str, metadata: Dict[str, object], today: dt.date | None = None) -> Dict[str, object]:
    """Return renewal status for a certificate check event."""

    result = renew(domain, metadata, today=today)
    if result.get("renewed"):
        result["event"] = "registrar:cert.renewed"
    return result
