"""Safe zone diffing helpers."""

from __future__ import annotations

from typing import Dict, List, Sequence, Tuple

Record = Dict[str, object]
Zone = Dict[str, List[Record]]


def diff_zone(current: Zone, desired: Zone) -> List[dict]:
    """Return a human-readable diff between the two zones."""

    diffs: List[dict] = []
    names = sorted(set(current) | set(desired))

    for name in names:
        current_records = list(current.get(name, []))
        desired_records = list(desired.get(name, []))
        matched = _pair_by_type(current_records, desired_records)

        for before, after in matched:
            if before.get("ttl") != after.get("ttl") or before.get("value") != after.get("value"):
                diffs.append(
                    {
                        "action": "change",
                        "name": name,
                        "from": before,
                        "to": after,
                    }
                )
            current_records.remove(before)
            desired_records.remove(after)

        if desired_records:
            diffs.append({"action": "add", "name": name, "records": desired_records})
        if current_records:
            diffs.append({"action": "remove", "name": name, "records": current_records})

    return diffs


def _pair_by_type(left: Sequence[Record], right: Sequence[Record]) -> List[Tuple[Record, Record]]:
    """Pair records that share the same DNS record type."""

    matches: List[Tuple[Record, Record]] = []
    right_pool: Dict[str, List[Record]] = {}
    for item in right:
        right_pool.setdefault(str(item.get("type")), []).append(item)

    for item in left:
        record_type = str(item.get("type"))
        bucket = right_pool.get(record_type)
        if bucket:
            counterpart = bucket.pop(0)
            matches.append((item, counterpart))

    return matches
