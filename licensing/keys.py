from __future__ import annotations

import json
import hmac
import hashlib
from pathlib import Path
from typing import Dict

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
SECRET_PATH = ROOT / "config" / "license_secret.txt"


def _get_secret() -> bytes:
    secret = storage.read(str(SECRET_PATH)).strip()
    if not secret:
        raise RuntimeError("missing license secret")
    return secret.encode()


def generate_key(tenant: str, sku: str, seats: int, start: str, end: str) -> str:
    payload = {
        "tenant": tenant,
        "sku": sku,
        "seats": seats,
        "start": start,
        "end": end,
    }
    payload_json = json.dumps(payload, sort_keys=True)
    sig = hmac.new(_get_secret(), payload_json.encode(), hashlib.sha256).hexdigest()
    return (payload_json + "." + sig).encode().hex()


def verify_key(key_str: str) -> Dict:
    try:
        raw = bytes.fromhex(key_str).decode()
        payload_json, sig = raw.rsplit(".", 1)
    except Exception as exc:  # invalid format
        raise ValueError("invalid key") from exc
    expected = hmac.new(_get_secret(), payload_json.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        raise ValueError("invalid signature")
    return json.loads(payload_json)
