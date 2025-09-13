import os
import warnings
from pathlib import Path
from datetime import datetime

try:
    import pyarrow  # type: ignore
    HAS_ARROW = True
except Exception:  # pragma: no cover - optional dependency
    HAS_ARROW = False

DATA_ROOT = Path(os.environ.get("DATA_ROOT", "data"))
LAKE_ROOT = DATA_ROOT / os.environ.get("LAKE_ROOT", "lake")
LAKE_FORMAT = os.environ.get("LAKE_FORMAT", "parquet")
if LAKE_FORMAT == "parquet" and not HAS_ARROW:
    warnings.warn("pyarrow not available, falling back to CSV")
    LAKE_FORMAT = "csv"


def table_root(name: str) -> Path:
    return LAKE_ROOT / name


def part_path(name: str, dt: datetime) -> Path:
    ext = "parquet" if LAKE_FORMAT == "parquet" else "csv"
    partition = dt.strftime("%Y/%m")
    table_dir = table_root(name) / partition
    table_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(table_dir.glob(f"part-*.{ext}"))
    idx = len(existing) + 1
    return table_dir / f"part-{idx:04d}.{ext}"


def iter_parts(name: str):
    ext = "parquet" if LAKE_FORMAT == "parquet" else "csv"
    root = table_root(name)
    if not root.exists():
        return []
    return sorted(root.glob(f"**/part-*.{ext}"))

