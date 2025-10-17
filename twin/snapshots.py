from __future__ import annotations

import hashlib
import json
import os
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from tools import storage
from . import incr

ROOT = Path(__file__).resolve().parents[1]
CHECKPOINTS = ROOT / "artifacts" / "twin" / "checkpoints"


def _hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass
class CheckpointInfo:
    name: str
    created_at: str
    manifest: List[Dict[str, Any]]
    settings_digest: str


DEFAULT_INCLUDE = ["orchestrator", "artifacts", "lake", "configs"]


def create_checkpoint(name: str, include: List[str] = None) -> str:
    include = include or DEFAULT_INCLUDE
    dest = CHECKPOINTS / name
    os.makedirs(dest, exist_ok=True)

    manifest = []
    for item in include:
        src = ROOT / item
        if not src.exists():
            continue
        shutil.copytree(src, dest / item, dirs_exist_ok=True)
        for file in (dest / item).rglob("*"):
            if file.is_file():
                manifest.append({
                    "file": str(file.relative_to(dest)),
                    "hash": _hash_file(file),
                    "size": file.stat().st_size,
                })

    info = {
        "name": name,
        "created_at": datetime.utcnow().isoformat(),
        "manifest": manifest,
        "settings_digest": hashlib.sha256(json.dumps(include).encode()).hexdigest(),
    }
    storage.write(str(dest / "manifest.json"), info)
    incr("twin_checkpoint_create")
    return str(dest)


def list_checkpoints() -> List[Dict[str, Any]]:
    results = []
    if not CHECKPOINTS.exists():
        return results
    for d in sorted(CHECKPOINTS.iterdir()):
        if d.is_dir():
            data = json.loads(storage.read(str(d / "manifest.json")) or '{}')
            if data:
                results.append({"name": data.get("name"), "created_at": data.get("created_at")})
    return results


def restore_checkpoint(name: str) -> None:
    if os.environ.get("READ_ONLY") or os.environ.get("DRY_RUN"):
        print("Warning: restore in read-only mode; no action taken")
        return
    src = CHECKPOINTS / name
    manifest_path = src / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(name)
    data = json.loads(storage.read(str(manifest_path)))
    for entry in data.get("manifest", []):
        src_rel = Path(entry["file"])
        src_path = src / src_rel
        dest_path = ROOT / src_rel
        os.makedirs(dest_path.parent, exist_ok=True)
        if src_path.is_dir():
            shutil.copytree(src_path, dest_path, dirs_exist_ok=True)
        else:
            shutil.copy2(src_path, dest_path)
    incr("twin_restore")
