from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

# Base artifacts directory for security operations
ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = ROOT / "artifacts" / "sec"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

METRICS_FILE = ARTIFACT_DIR / "metrics.json"
METRICS: Counter[str] = Counter()


def _write(path: Path, data: Any) -> None:
    """Write JSON data and a sha256 integrity file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True)
    digest = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
    with path.with_suffix(path.suffix + ".sha256").open("w", encoding="utf-8") as f:
        f.write(digest)


def write_json(path: Path, data: Any) -> None:
    _write(path, data)


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def record_metric(name: str, count: int = 1) -> None:
    METRICS[name] += count
    _write(METRICS_FILE, dict(METRICS))
