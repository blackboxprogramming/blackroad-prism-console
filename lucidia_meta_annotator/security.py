"""Simplified config signing utilities.

This module implements a very small signature mechanism based on
SHA256 digests.  A configuration is considered valid if a companion
``.sig`` file exists containing the hexadecimal digest of the config
content.  This is **not** Ed25519 but provides a deterministic way to
exercise signature checks in tests without external dependencies.
"""
from __future__ import annotations
from pathlib import Path
import hashlib

class SignatureError(RuntimeError):
    pass


def verify_config(path: str | Path, signature_path: str | Path | None) -> None:
    if signature_path is None:
        return
    p = Path(path)
    s = Path(signature_path)
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    expected = s.read_text().strip()
    if digest != expected:
        raise SignatureError("signature mismatch")
