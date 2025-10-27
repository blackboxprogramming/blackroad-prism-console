"""Simple signing helper for Sentinel artifacts."""

from __future__ import annotations

import base64
import hmac
from hashlib import sha256
from pathlib import Path
from typing import Dict

DEFAULT_SECRET = b"codex-32-sentinel"


def _artifact_digest(artifact: str | Path) -> bytes:
    path = Path(artifact)
    data = path.read_bytes() if path.exists() else artifact.encode()
    digest = sha256()
    digest.update(data)
    return digest.digest()


def sign(artifact: str, sbom: object, *, secret: bytes | None = None) -> Dict[str, str]:
    """Return a detached signature over ``artifact`` and ``sbom``."""

    key = secret or DEFAULT_SECRET
    signer = hmac.new(key, digestmod=sha256)
    signer.update(_artifact_digest(artifact))
    signer.update(repr(sbom).encode())
    signature = base64.b64encode(signer.digest()).decode()
    return {
        "artifact": artifact,
        "signature": signature,
        "algorithm": "HMAC-SHA256",
    }
