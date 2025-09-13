from __future__ import annotations

from contracts.validate import validate_rows
from lake.io import write_table


def run() -> None:
    rows = [
        {"date": "2025-06-01", "region": "NA", "product": "A", "amount": 100.0, "profit": 40.0},
        {"date": "2025-06-01", "region": "EU", "product": "A", "amount": 200.0, "profit": 80.0},
    ]
    validate_rows("finance_txn", rows)
    write_table("finance_txn", rows)

