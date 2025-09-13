from __future__ import annotations

import csv
import json
from datetime import datetime
from typing import Callable, Iterable, Iterator, List, Dict

from .layout import LAKE_FORMAT, HAS_ARROW, part_path, iter_parts
from metrics import emit

if HAS_ARROW:
    import pyarrow as pa  # type: ignore
    import pyarrow.parquet as pq  # type: ignore


def _parse_val(v: str):
    for cast in (int, float):
        try:
            return cast(v)
        except ValueError:
            pass
    try:
        return json.loads(v)
    except Exception:
        return v


def write_table(name: str, rows: List[Dict]):
    """Write rows to a partitioned table."""
    emit("lake_write")
    path = part_path(name, datetime.utcnow())
    if LAKE_FORMAT == "parquet" and HAS_ARROW:
        table = pa.Table.from_pylist(rows)
        pq.write_table(table, path)
    else:
        path = path.with_suffix(".csv") if path.suffix != ".csv" else path
        with open(path, "w", newline="", encoding="utf-8") as fh:
            if rows:
                writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
    return path


def scan_table(name: str, where: Callable[[Dict], bool] | None = None) -> Iterator[Dict]:
    """Yield rows from a table optionally filtered by a predicate."""
    emit("lake_scan")
    for path in iter_parts(name):
        if path.suffix == ".parquet" and HAS_ARROW:
            table = pq.read_table(path)
            for row in table.to_pylist():
                if where is None or where(row):
                    yield row
        else:
            with open(path, newline="", encoding="utf-8") as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    parsed = {k: _parse_val(v) for k, v in row.items()}
                    if where is None or where(parsed):
                        yield parsed

