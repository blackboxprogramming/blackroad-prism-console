from __future__ import annotations

from contracts.validate import validate_rows
from lake.io import write_table


def run() -> None:
    rows = [
        {"date": "2025-06-01", "region": "NA", "downtime": 10.0, "window": 1440.0},
        {"date": "2025-06-02", "region": "NA", "downtime": 0.0, "window": 1440.0},
    ]
    validate_rows("incidents", rows)
    write_table("incidents", rows)

