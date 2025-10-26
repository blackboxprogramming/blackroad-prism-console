"""Collection utilities for building evidence bundles."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List

EvidenceBundle = Dict[str, Any]


def _ensure_list(candidate: Any) -> List[Any]:
    """Return ``candidate`` as a list.

    Scalars are wrapped, ``None`` becomes an empty list, and existing lists are
    shallow-copied so that callers cannot mutate the bundle through shared
    references.
    """

    if candidate is None:
        return []
    if isinstance(candidate, list):
        return list(candidate)
    return [candidate]


def _merge_tags(*candidates: Iterable[str]) -> List[str]:
    """Merge multiple iterables into a de-duplicated list preserving order."""

    merged: List[str] = []
    for iterable in candidates:
        for item in iterable or []:
            if item not in merged:
                merged.append(item)
    return merged


def collect(event: Dict[str, Any]) -> EvidenceBundle:
    """Normalise an incoming event into an evidence bundle.

    Parameters
    ----------
    event:
        Event payload produced by workflow hooks (e.g. PR merge, deployment
        attempt). The structure is expected to include optional ``artifacts``,
        ``logs``, ``metrics``, and ``metadata`` keys.

    Returns
    -------
    EvidenceBundle
        A dictionary shaped according to ``evidence_bundle.schema.json``. The
        returned bundle is decoupled from the source event to prevent accidental
        mutation.
    """

    if not isinstance(event, dict):
        raise TypeError("event must be a dictionary")

    event_metadata = event.get("metadata", {})
    raw_metadata = deepcopy(event_metadata if isinstance(event_metadata, dict) else {})
    metadata: Dict[str, Any] = {
        "source_event": event.get("type", "unknown"),
        "source_event_id": event.get("id"),
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "pii_scrubbed": bool(raw_metadata.get("pii_scrubbed") or event.get("pii_scrubbed")),
        "risk_topics": _ensure_list(raw_metadata.get("risk_topics")),
        "risk_level": raw_metadata.get("risk_level", "low"),
        "reviewer": raw_metadata.get("reviewer"),
        "dataset_hashes": _ensure_list(raw_metadata.get("dataset_hashes")),
        "references": _ensure_list(raw_metadata.get("references")),
    }

    tags = _merge_tags(
        metadata.get("risk_topics", []),
        _ensure_list(event.get("tags")),
    )
    if tags:
        metadata["risk_topics"] = tags

    bundle: EvidenceBundle = {
        "artifacts": _ensure_list(deepcopy(event.get("artifacts"))),
        "logs": [str(item) for item in _ensure_list(event.get("logs"))],
        "metrics": deepcopy(event.get("metrics", {})),
        "metadata": metadata,
    }

    notes = event.get("notes")
    if notes:
        bundle["logs"].append(str(notes))

    if event.get("decisions"):
        bundle.setdefault("artifacts", []).append({"decisions": deepcopy(event["decisions"])})

    return bundle


__all__ = ["collect", "EvidenceBundle"]
