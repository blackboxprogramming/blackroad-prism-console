"""Receipt minting utilities for Codex-28 Auditor."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from .collect_artifacts import EvidenceBundle
from .hash_lineage import lineage

TARGET_JOULES_PER_REPORT = 2.0


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value))
    except (TypeError, ValueError):
        return None


def _energy_section(bundle: EvidenceBundle) -> Dict[str, Any]:
    metrics = bundle.get("metrics", {}) if isinstance(bundle, dict) else {}
    observed = _coerce_float(metrics.get("energy_j") or metrics.get("energy_joules"))
    if observed is None:
        observed = 0.0
    return {
        "actual_joules": observed,
        "target_joules": TARGET_JOULES_PER_REPORT,
        "within_target": observed <= TARGET_JOULES_PER_REPORT,
    }


def _outputs_section(bundle: EvidenceBundle) -> Dict[str, Any]:
    return {
        "artifacts": len(bundle.get("artifacts", [])),
        "logs": len(bundle.get("logs", [])),
        "metrics": list(bundle.get("metrics", {}).keys()),
    }


def mint(bundle: EvidenceBundle, ok: bool, violations: List[Dict[str, Any]] | None = None) -> Dict[str, Any]:
    """Mint an attestation receipt for ``bundle``."""

    if not isinstance(bundle, dict):
        raise TypeError("bundle must be a dictionary")

    receipt_hashes = bundle.get("hashes") or lineage(bundle)

    receipt = {
        "receipt_id": str(uuid4()),
        "agent": "codex-28",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "inputs": bundle.get("metadata", {}),
        "outputs": _outputs_section(bundle),
        "hashes": receipt_hashes,
        "energy": _energy_section(bundle),
        "policy_pass": bool(ok),
        "violations": violations or [],
    }

    return receipt


__all__ = ["mint", "TARGET_JOULES_PER_REPORT"]
