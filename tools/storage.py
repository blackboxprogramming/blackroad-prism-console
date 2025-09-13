from __future__ import annotations

from pathlib import Path

from config import settings
from security import crypto

DATA_ROOT = Path('data')
TEXT_EXTS = {'.json', '.jsonl', '.md', '.csv'}


def _needs_encrypt(path: Path) -> bool:
    try:
        rel = path.resolve().relative_to(DATA_ROOT.resolve())
    except ValueError:
        return False
    return settings.ENCRYPT_DATA_AT_REST and path.suffix in TEXT_EXTS


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if _needs_encrypt(path):
        data = crypto.encrypt_bytes(data)
    path.write_bytes(data)


def read_bytes(path: Path) -> bytes:
    data = path.read_bytes()
    if _needs_encrypt(path) and data.startswith(crypto.HEADER):
        data = crypto.decrypt_bytes(data)
    return data
