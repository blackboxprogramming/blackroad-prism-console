from __future__ import annotations

import hashlib
import json
import platform
import sys
from pathlib import Path

import settings


def _file_hash(path: Path) -> str:
    data = path.read_bytes() if path.exists() else b""
    return hashlib.sha256(data).hexdigest()


def create_env_stamp(path: Path) -> Path:
    env = {
        "python": sys.version,
        "platform": platform.platform(),
        "dependency_hash": _file_hash(Path("requirements.txt")),
        "settings_digest": hashlib.sha256(str(vars(settings)).encode()).hexdigest(),
        "random_seed": getattr(settings, "RANDOM_SEED", 0),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(env, indent=2), encoding="utf-8")
    return path
