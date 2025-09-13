"""Disaster recovery tabletop drill."""
from __future__ import annotations

from pathlib import Path
from typing import List

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts"


def tabletop() -> List[str]:
    steps = [
        "Verify backups exist",
        "Simulate restore",
        "Validate artifacts",
    ]
    if not ART_DIR.exists():
        steps.append("No artifacts to restore")
    else:
        for path in ART_DIR.rglob("*"):
            if path.is_file():
                storage.read(str(path))
    return steps
