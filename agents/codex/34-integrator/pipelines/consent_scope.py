"""Consent scope helpers for Codex-34."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import yaml

_ROOT = Path(__file__).resolve().parent.parent


def _load_seed() -> dict:
    with (_ROOT / "codex34.yaml").open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def approve_scope(requested_scopes: Iterable[str], ttl_seconds: int | None = None) -> dict:
    """Approve a subset of scopes with an explicit TTL."""

    seed = _load_seed()
    catalogue = set(seed.get("consent", {}).get("scopes_example", []))
    approved = [scope for scope in requested_scopes if scope in catalogue]
    if not approved:
        raise PermissionError("No requested scopes are approved for Integrator")

    ttl = ttl_seconds or int(seed.get("consent", {}).get("ttl_seconds_default", 3600))
    expiry = datetime.now(timezone.utc) + timedelta(seconds=ttl)

    return {
        "scopes": approved,
        "ttl_seconds": ttl,
        "expires_at": expiry.isoformat(),
    }


__all__ = ["approve_scope"]
