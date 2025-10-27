"""Envelope encryption helpers for Sentinel secret issuance."""

from __future__ import annotations

import base64
import hmac
import os
import time
from dataclasses import dataclass, asdict
from hashlib import sha256
from typing import Dict

DEFAULT_SECRET = b"sentinel-envelope"


@dataclass
class SecretGrant:
    token: str
    principal: str
    scope: str
    ttl: int
    expires_at: float

    def to_dict(self) -> Dict[str, object]:
        return asdict(self)


def _sign(payload: bytes, *, secret: bytes) -> str:
    signer = hmac.new(secret, payload, sha256)
    return base64.urlsafe_b64encode(signer.digest()).decode()


def issue_token(principal: str, *, scope: str, ttl: int, secret: bytes | None = None) -> SecretGrant:
    """Return a signed token with the provided scope."""

    key = secret or DEFAULT_SECRET
    nonce = base64.urlsafe_b64encode(os.urandom(12)).decode()
    expires_at = time.time() + ttl
    payload = f"{principal}:{scope}:{nonce}:{int(expires_at)}".encode()
    signature = _sign(payload, secret=key)
    token = base64.urlsafe_b64encode(payload).decode() + "." + signature
    return SecretGrant(token=token, principal=principal, scope=scope, ttl=ttl, expires_at=expires_at)


def validate_token(token: str, *, secret: bytes | None = None) -> bool:
    """Validate the HMAC on the issued token."""

    key = secret or DEFAULT_SECRET
    try:
        payload_b64, signature = token.split(".", 1)
    except ValueError:
        return False
    payload = base64.urlsafe_b64decode(payload_b64)
    expected = _sign(payload, secret=key)
    return hmac.compare_digest(signature, expected)
