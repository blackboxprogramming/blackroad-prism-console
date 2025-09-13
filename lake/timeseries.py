from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable, Dict, List


def _floor(dt: datetime, freq: str) -> datetime:
    if freq == "D":
        return datetime(dt.year, dt.month, dt.day)
    if freq == "W":
        start = dt - timedelta(days=dt.weekday())
        return datetime(start.year, start.month, start.day)
    if freq == "M":
        return datetime(dt.year, dt.month, 1)
    raise ValueError("unsupported freq")


def resample(rows: Iterable[Dict], key_ts: str, freq: str, agg: Dict[str, str]):
    """Resample rows by a timestamp key with simple aggregations.

    Missing periods are filled with zeroes.
    """
    rows = list(rows)
    if not rows:
        return []
    dts = [datetime.fromisoformat(r[key_ts]) for r in rows]
    start = _floor(min(dts), freq)
    end = _floor(max(dts), freq)
    buckets = {}
    cur = start
    delta = {"D": timedelta(days=1), "W": timedelta(weeks=1), "M": timedelta(days=30)}[freq]
    while cur <= end:
        buckets[cur] = []
        cur += delta
    for row, dt in zip(rows, dts):
        buckets[_floor(dt, freq)].append(row)
    out = []
    for period, items in buckets.items():
        res = {key_ts: period.date().isoformat()}
        for field, fn in agg.items():
            vals = [r.get(field, 0) for r in items]
            if fn == "sum":
                res[field] = sum(vals)
            elif fn == "avg":
                res[field] = sum(vals) / len(vals) if vals else 0
        out.append(res)
    return out

