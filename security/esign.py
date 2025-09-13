import json
import os
import hmac
import hashlib
import secrets
from datetime import datetime
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[1]
KEY_FILE = Path(os.environ.get("ESIGN_KEY_FILE", ROOT / "config" / "esign_keys.json"))


def _load_keys() -> Dict[str, str]:
    if KEY_FILE.exists():
        try:
            return json.loads(KEY_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def _save_keys(keys: Dict[str, str]) -> None:
    KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
    KEY_FILE.write_text(json.dumps(keys))


def keygen(user: str) -> str:
    """Generate a new secret for a user."""
    keys = _load_keys()
    secret = secrets.token_hex(32)
    keys[user] = secret
    _save_keys(keys)
    return secret


def sign_statement(actor_id: str, text: str) -> Dict[str, str]:
    keys = _load_keys()
    secret = keys.get(actor_id)
    if not secret:
        raise ValueError("unknown-actor")
    sig = hmac.new(bytes.fromhex(secret), text.encode("utf-8"), hashlib.sha256).hexdigest()
    key_fp = secret[:8]
    ts = datetime.utcnow().isoformat()
    return {"signature": sig, "key_fp": key_fp, "ts": ts}


def verify_statement(signature: str, actor_id: str, text: str) -> bool:
    keys = _load_keys()
    secret = keys.get(actor_id)
    if not secret:
        return False
    expected = hmac.new(bytes.fromhex(secret), text.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

