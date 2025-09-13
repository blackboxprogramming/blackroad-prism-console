import json
import shutil
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from typing import Dict, List

from bench.runner import METRICS_PATH
from tools import storage

ROOT = Path(".").resolve()
CHECKPOINT_ROOT = Path("artifacts/twin/checkpoints")


INCLUDE_DEFAULT = ["orchestrator", "artifacts", "lake", "configs"]


def _hash_file(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def create_checkpoint(name: str, include: List[str] = INCLUDE_DEFAULT) -> str:
    base = CHECKPOINT_ROOT / name
    base.mkdir(parents=True, exist_ok=True)
    manifest: Dict[str, Dict] = {"created_at": datetime.utcnow().isoformat(), "files": []}
    for item in include:
        src = ROOT / item
        if not src.exists():
            continue
        dest = base / item
        if src.is_dir():
            shutil.copytree(src, dest)
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        for file in dest.rglob("*"):
            if file.is_file():
                manifest["files"].append(
                    {
                        "path": str(file.relative_to(base)),
                        "hash": _hash_file(file),
                        "size": file.stat().st_size,
                    }
                )
    manifest_path = base / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    storage.write(str(METRICS_PATH), {"event": "twin_checkpoint_create", "name": name})
    return str(base)


def list_checkpoints() -> List[Dict]:
    cps = []
    if not CHECKPOINT_ROOT.exists():
        return cps
    for cp in CHECKPOINT_ROOT.iterdir():
        if not cp.is_dir():
            continue
        manifest_path = cp / "manifest.json"
        created = None
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text())
            created = manifest.get("created_at")
        cps.append({"name": cp.name, "created_at": created})
    return cps


def restore_checkpoint(name: str) -> None:
    base = CHECKPOINT_ROOT / name
    if not base.exists():
        raise FileNotFoundError(name)
    for item in base.iterdir():
        if item.name == "manifest.json":
            continue
        dest = ROOT / item.name
        if dest.exists():
            if dest.is_dir():
                shutil.rmtree(dest)
            else:
                dest.unlink()
        shutil.copytree(item, dest)
    storage.write(str(METRICS_PATH), {"event": "twin_restore", "name": name})
