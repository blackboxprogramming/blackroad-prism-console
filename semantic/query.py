from __future__ import annotations

from collections import defaultdict
from typing import Callable, Dict, List

from metrics import emit
from lake.io import scan_table
from .catalog import SemanticModel

MODEL = SemanticModel()

TABLE_FOR_METRIC = {
    "revenue": "finance_txn",
    "gross_margin_pct": "finance_txn",
    "uptime": "incidents",
}


def _build_pred(filters: Dict[str, Callable]) -> Callable:
    def pred(row: Dict) -> bool:
        for field, fn in filters.items():
            if not fn(row.get(field)):
                return False
        return True

    return pred


def evaluate(metric_id: str, filters: Dict[str, Callable] | None, group_by: List[str]) -> List[Dict]:
    """Evaluate a metric with optional filters and grouping."""
    emit("semantic_query")
    table = TABLE_FOR_METRIC[metric_id]
    where = _build_pred(filters or {})
    groups: Dict[tuple, List[Dict]] = defaultdict(list)
    for row in scan_table(table, where):
        key = tuple(row.get(dim) for dim in group_by)
        groups[key].append(row)
    metric = MODEL.metrics[metric_id]
    results: List[Dict] = []
    for key, rows in groups.items():
        value = metric.sql(rows)
        record = {group_by[i]: key[i] for i in range(len(group_by))}
        record[metric_id] = value
        results.append(record)
    return results

