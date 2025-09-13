from tools import storage
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def apply() -> None:
    path = ROOT / "artifacts" / "trace_ids.txt"
    if not Path(path).exists():
        storage.write(str(path), "trace_id")
