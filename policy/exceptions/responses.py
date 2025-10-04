"""Helpers for shaping policy violation responses."""

from __future__ import annotations

from typing import Dict

from .specs import RuleSpec, load_rule


def _escape_reason(reason: str) -> str:
    return reason.replace("\"", "\\\"")


def build_policy_violation_error(
    *,
    rule_id: str,
    reason: str,
    message: str,
    subject_type: str,
    subject_id: str,
    org_id: str,
) -> Dict[str, object]:
    """Construct a rich error payload with exception hint metadata."""

    spec: RuleSpec = load_rule(rule_id)
    hint_reason = _escape_reason(reason)
    hint = (
        f"/exception rule={rule_id} "
        f"subject={subject_type}:{subject_id} org={org_id} "
        f'reason="{hint_reason}"'
    )
    owners = list(spec.owners)
    payload: Dict[str, object] = {
        "error": {
            "code": "policy_violation",
            "rule_id": rule_id,
            "reason": reason,
            "message": message,
            "docs_url": spec.docs_url,
            "owners": owners,
            "request_exception_hint": hint,
        }
    }
    return payload
