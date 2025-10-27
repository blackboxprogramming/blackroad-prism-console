"""Diff and patch helpers for Codex-34."""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Iterable, List


Diff = List[Dict[str, Any]]


def compute_diff(current: Dict[str, Any], desired: Dict[str, Any]) -> Diff:
    """Compute a shallow diff between two dictionaries.

    Each diff entry is an RFC 6902 inspired dict with ``op``, ``path`` and ``value`` when
    relevant. Only top-level keys are compared to keep the runtime predictable for the
    small payloads managed by Codex-34.
    """

    diff: Diff = []
    current_keys = set(current)
    desired_keys = set(desired)

    for key in sorted(desired_keys - current_keys):
        diff.append({"op": "add", "path": f"/{key}", "value": desired[key]})

    for key in sorted(current_keys - desired_keys):
        diff.append({"op": "remove", "path": f"/{key}"})

    for key in sorted(current_keys & desired_keys):
        if current[key] != desired[key]:
            diff.append({"op": "replace", "path": f"/{key}", "value": desired[key]})

    return diff


def apply_patch(current: Dict[str, Any], diff: Diff) -> Dict[str, Any]:
    """Apply a diff produced by :func:`compute_diff`."""

    result = deepcopy(current)
    for entry in diff:
        op = entry["op"]
        path = entry["path"].lstrip("/")
        if op == "add" or op == "replace":
            result[path] = entry.get("value")
        elif op == "remove":
            result.pop(path, None)
        else:  # pragma: no cover - defensive branch
            raise ValueError(f"Unsupported diff op: {op}")
    return result


def summarize(diff: Diff) -> str:
    """Produce a human-friendly summary of the diff."""

    parts: Iterable[str] = (f"{entry['op']} {entry['path']}" for entry in diff)
    return ", ".join(parts)


__all__ = ["compute_diff", "apply_patch", "summarize", "Diff"]
