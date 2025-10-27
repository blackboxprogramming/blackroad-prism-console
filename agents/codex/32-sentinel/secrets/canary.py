"""Canary credential helpers for Sentinel."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Dict

from .envelope import issue_token


@dataclass
class CanaryCredential:
    token: str
    label: str
    created_at: float

    def to_dict(self) -> Dict[str, object]:
        return {"token": self.token, "label": self.label, "created_at": self.created_at}


def create_canary(label: str, *, scope: str = "read-only", ttl: int = 900) -> CanaryCredential:
    """Issue a marked secret suitable for tripwire deployments."""

    grant = issue_token(f"canary-{label}", scope=scope, ttl=ttl)
    return CanaryCredential(token=grant.token, label=label, created_at=time.time())


def is_tripwire(token: str) -> bool:
    """Return ``True`` when ``token`` matches the canary prefix."""

    return token.startswith("Y2FuYXJ5")  # base64 for "canary"
