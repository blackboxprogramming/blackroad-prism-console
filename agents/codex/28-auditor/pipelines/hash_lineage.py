"""Hash computation helpers for lineage tracking."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Iterable, List

from .collect_artifacts import EvidenceBundle


def _hash_payload(payload: Any) -> str:
    """Return a SHA-256 hex digest for ``payload``."""

    normalised = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(normalised.encode("utf-8")).hexdigest()


def _hash_iterable(iterable: Iterable[Any]) -> List[str]:
    """Hash each element of ``iterable`` and return the digest list."""

    return [_hash_payload(item) for item in iterable]


def lineage(bundle: EvidenceBundle) -> Dict[str, Any]:
    """Generate deterministic hashes for the supplied evidence bundle."""

    if not isinstance(bundle, dict):
        raise TypeError("bundle must be a dictionary")

    artifacts = bundle.get("artifacts", [])
    logs = bundle.get("logs", [])
    metrics = bundle.get("metrics", {})
    metadata = bundle.get("metadata", {})

    hashes = {
        "bundle": _hash_payload({k: bundle[k] for k in bundle if k != "hashes"}),
        "artifacts": _hash_iterable(artifacts),
        "logs": _hash_iterable(str(item) for item in logs),
        "metrics": {key: _hash_payload(value) for key, value in metrics.items()},
        "metadata": _hash_payload(metadata),
    }

    return hashes


__all__ = ["lineage"]
