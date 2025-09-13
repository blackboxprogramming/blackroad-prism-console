from tools import storage
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def apply() -> None:
    path = ROOT / "artifacts" / "migrated.txt"
    if not Path(path).exists():
        storage.write(str(path), "initialized")
