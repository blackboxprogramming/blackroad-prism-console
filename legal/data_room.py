from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path
from typing import List, Dict

from tools import artifacts
from .clm import all_contracts

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "legal" / "data_room"


def _hash_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(include: List[str]) -> List[Dict[str, str]]:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    manifest: List[Dict[str, str]] = []
    if "contracts" in include:
        for c in all_contracts():
            if c.status not in {"approved", "executed"}:
                continue
            for doc in c.docs:
                src = Path(doc)
                if not src.exists():
                    continue
                dst = ART_DIR / src.name
                shutil.copyfile(src, dst)
                manifest.append({"path": dst.name, "hash": _hash_file(dst), "source": str(src)})
    artifacts.validate_and_write(
        str(ART_DIR / "manifest.json"), manifest, str(ROOT / "schemas" / "legal_dataroom.schema.json")
    )
    return manifest
