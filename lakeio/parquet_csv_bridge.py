from __future__ import annotations

import csv
from pathlib import Path
from typing import List, Dict

from lake.io import write_table, scan_table, HAS_ARROW
from contracts.validate import validate_rows

if HAS_ARROW:
    import pyarrow as pa  # type: ignore
    import pyarrow.parquet as pq  # type: ignore


def export_table(name: str, fmt: str, out_path: Path) -> None:
    rows = list(scan_table(name))
    if fmt == "csv":
        if rows:
            with open(out_path, "w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
    elif fmt == "parquet" and HAS_ARROW:
        table = pa.Table.from_pylist(rows)
        pq.write_table(table, out_path)
    else:
        raise ValueError("unsupported format")


def import_table(name: str, fmt: str, in_path: Path) -> None:
    if fmt == "csv":
        with open(in_path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            rows = list(reader)
    elif fmt == "parquet" and HAS_ARROW:
        table = pq.read_table(in_path)
        rows = table.to_pylist()
    else:
        raise ValueError("unsupported format")
    validate_rows(name, rows)
    write_table(name, rows)

