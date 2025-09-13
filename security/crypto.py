from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # type: ignore

KEY_PATH = Path('config/ear_key.json')
NEW_KEY_PATH = Path('config/ear_key.new.json')

HEADER = b'EAR1'


def _get_key_path(new: bool = False) -> Path:
    return NEW_KEY_PATH if new else KEY_PATH


def generate_key() -> str:
    key = AESGCM.generate_key(bit_length=256)
    kid = base64.urlsafe_b64encode(os.urandom(6)).decode('utf-8')
    data = {'id': kid, 'key': base64.b64encode(key).decode('utf-8')}
    KEY_PATH.write_text(json.dumps(data))
    return kid


def _load_key(path: Path | None = None) -> Tuple[str, bytes]:
    p = path or KEY_PATH
    data = json.loads(p.read_text())
    return data['id'], base64.b64decode(data['key'])


def encrypt_bytes(b: bytes) -> bytes:
    _, key = _load_key()
    aes = AESGCM(key)
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, b, None)
    return HEADER + nonce + ct


def decrypt_bytes(b: bytes) -> bytes:
    if not b.startswith(HEADER):
        raise ValueError('not encrypted')
    nonce = b[4:16]
    ct = b[16:]
    _, key = _load_key()
    aes = AESGCM(key)
    return aes.decrypt(nonce, ct, None)


def rotate_key() -> str:
    key = AESGCM.generate_key(bit_length=256)
    kid = base64.urlsafe_b64encode(os.urandom(6)).decode('utf-8')
    data = {'id': kid, 'key': base64.b64encode(key).decode('utf-8')}
    NEW_KEY_PATH.write_text(json.dumps(data))
    return kid


def rotate_data(root: Path = Path('data')) -> int:
    """Re-encrypt files under root using new key."""
    if not NEW_KEY_PATH.exists() or not KEY_PATH.exists():
        return 0
    old_kid, old_key = _load_key(KEY_PATH)
    new_kid, new_key = _load_key(NEW_KEY_PATH)
    old_aes = AESGCM(old_key)
    new_aes = AESGCM(new_key)
    count = 0
    for path in root.rglob('*'):
        if path.is_file():
            data = path.read_bytes()
            if data.startswith(HEADER):
                nonce = data[4:16]
                ct = data[16:]
                pt = old_aes.decrypt(nonce, ct, None)
                new_nonce = os.urandom(12)
                new_ct = new_aes.encrypt(new_nonce, pt, None)
                path.write_bytes(HEADER + new_nonce + new_ct)
                count += 1
    NEW_KEY_PATH.replace(KEY_PATH)
    return count


def status(root: Path = Path('data')) -> dict:
    enabled = KEY_PATH.exists()
    kid = None
    if enabled:
        kid, _ = _load_key()
    count = 0
    if root.exists():
        for path in root.rglob('*'):
            if path.is_file() and path.read_bytes().startswith(HEADER):
                count += 1
    return {'enabled': enabled, 'key_id': kid, 'files': count}
