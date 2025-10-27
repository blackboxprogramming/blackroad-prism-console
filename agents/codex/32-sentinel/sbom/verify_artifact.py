"""Verification helpers for Sentinel signatures."""

from __future__ import annotations

import base64
import hmac
from hashlib import sha256
from typing import Dict

from .sign_artifact import DEFAULT_SECRET, _artifact_digest


def verify(artifact: str, signature: Dict[str, str], sbom: object | None = None, *, secret: bytes | None = None) -> bool:
    """Validate the ``signature`` for ``artifact``.

    When ``sbom`` is provided we mix it into the expected digest so that the
    attestation becomes tamper evident.
    """

    expected_key = secret or DEFAULT_SECRET
    signer = hmac.new(expected_key, digestmod=sha256)
    signer.update(_artifact_digest(artifact))
    if sbom is not None:
        signer.update(repr(sbom).encode())

    try:
        provided = base64.b64decode(signature["signature"])
    except (KeyError, ValueError):
        return False

    return hmac.compare_digest(signer.digest(), provided)
