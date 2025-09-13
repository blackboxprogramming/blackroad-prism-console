#
"""Developer Experience (DX) toolkit.

Utilities and helpers to improve monorepo developer workflows.
"""
from pathlib import Path
import json
from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "dx"


def _metrics_path() -> Path:
    return ARTIFACTS / "metrics.json"


def inc_counter(name: str) -> None:
    """Increment named counter in metrics artifact."""
    data = json.loads(storage.read(str(_metrics_path())) or "{}")
    data[name] = data.get(name, 0) + 1
    storage.write(str(_metrics_path()), data)
