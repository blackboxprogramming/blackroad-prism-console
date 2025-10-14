from __future__ import annotations

from typing import Dict, List


def to_rows(records: List[Dict], columns: List[str]) -> List[Dict]:
    """Project dictionaries to only the supplied columns."""
    return [{col: rec.get(col) for col in columns} for rec in records]
