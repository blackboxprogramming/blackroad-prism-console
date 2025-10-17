from __future__ import annotations

import hmac
import os
from hashlib import sha256
from typing import Any

from tools import storage

KEY_PATH = "dev_signing_key.txt"


def _get_key() -> bytes:
    try:
        key_hex = storage.read_text(KEY_PATH)
    except FileNotFoundError:
        key = os.urandom(32).hex()
        storage.write_text(KEY_PATH, key)
        key_hex = key
    return bytes.fromhex(key_hex.strip())


def sign(payload: dict[str, Any]) -> str:
    key = _get_key()
    msg = sha256(repr(sorted(payload.items())).encode()).digest()
    return hmac.new(key, msg, sha256).hexdigest()


def verify(payload: dict[str, Any], sig: str) -> bool:
    expected = sign(payload)
    return hmac.compare_digest(expected, sig)
