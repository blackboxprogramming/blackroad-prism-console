"""DNS zone diffing helpers for Codex-30 Registrar."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

import yaml

ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT / "rules" / "dns_policies.yaml"


@dataclass(frozen=True)
class ZoneRecord:
    name: str
    type: str
    value: str
    ttl: int
    priority: int | None = None

    @classmethod
    def from_dict(cls, payload: Dict[str, any]) -> "ZoneRecord":
        return cls(
            name=payload.get("name", "@"),
            type=payload["type"],
            value=payload["value"],
            ttl=int(payload.get("ttl", 300)),
            priority=payload.get("priority"),
        )

    def key(self) -> Tuple[str, str, str]:
        return self.name, self.type, self.value

    def to_dict(self) -> Dict[str, any]:
        payload = {"name": self.name, "type": self.type, "value": self.value, "ttl": self.ttl}
        if self.priority is not None:
            payload["priority"] = self.priority
        return payload


@dataclass(frozen=True)
class ZoneDiff:
    action: str
    record: ZoneRecord
    reason: str

    def to_dict(self) -> Dict[str, any]:
        return {"action": self.action, "record": self.record.to_dict(), "reason": self.reason}


def load_policies(path: Path = POLICY_PATH) -> Dict[str, any]:
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def _index_records(records: Iterable[Dict[str, any]]) -> Dict[Tuple[str, str, str], ZoneRecord]:
    index: Dict[Tuple[str, str, str], ZoneRecord] = {}
    for record in records:
        zr = ZoneRecord.from_dict(record)
        index[zr.key()] = zr
    return index



def diff_zone(
    current: Dict[str, any],
    desired: Dict[str, any],
    *,
    policies: Dict[str, any] | None = None,
) -> List[ZoneDiff]:
    policies = policies or load_policies()
    current_index = _index_records(current.get("records", []))
    desired_index = _index_records(desired.get("records", []))

    diffs: List[ZoneDiff] = []

    for key, record in desired_index.items():
        existing = current_index.get(key)
        if not existing:
            diffs.append(ZoneDiff(action="create", record=record, reason="missing"))
            continue
        if existing.ttl != record.ttl or existing.priority != record.priority:
            diffs.append(ZoneDiff(action="update", record=record, reason="attributes_changed"))

    for key, record in current_index.items():
        if key not in desired_index:
            diffs.append(ZoneDiff(action="delete", record=record, reason="unexpected"))

    ttl_hint = policies.get("metadata", {}).get("ttl_default")
    if ttl_hint:
        for record in desired_index.values():
            if record.ttl < int(ttl_hint):
                diffs.append(ZoneDiff(action="warn", record=record, reason="ttl_below_minimum"))

    return diffs


def apply_diff(current: Dict[str, any], diffs: Sequence[ZoneDiff]) -> Dict[str, any]:
    records = {ZoneRecord.from_dict(r).key(): ZoneRecord.from_dict(r) for r in current.get("records", [])}
    for diff in diffs:
        key = diff.record.key()
        if diff.action == "create":
            records[key] = diff.record
        elif diff.action == "update":
            records[key] = diff.record
        elif diff.action == "delete":
            records.pop(key, None)
    return {"domain": current.get("domain"), "records": [record.to_dict() for record in records.values()]}


def summarize(diffs: Sequence[ZoneDiff]) -> str:
    if not diffs:
        return "No changes"
    lines = ["Zone diff summary:"]
    for diff in diffs:
        lines.append(f"- {diff.action.upper()}: {diff.record.name} {diff.record.type} -> {diff.reason}")
    return "\n".join(lines)


__all__ = ["ZoneDiff", "ZoneRecord", "apply_diff", "diff_zone", "load_policies", "summarize"]
