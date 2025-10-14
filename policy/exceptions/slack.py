"""Slack card helpers for approval flows."""

from __future__ import annotations

import json
from typing import Any, Iterable

from .specs import RuleSpec, load_rule


def format_owners_line(owners: Iterable[str]) -> str:
    owners = [owner for owner in (o.strip() for o in owners) if owner]
    if not owners:
        return "*Owners:* _unassigned_"
    return "*Owners:* " + ", ".join(owners)


def section(text: str) -> dict[str, Any]:
    return {
        "type": "section",
        "text": {"type": "mrkdwn", "text": text},
    }


def button(label: str, style: str, action_id: str, value: str) -> dict[str, Any]:
    return {
        "type": "button",
        "text": {"type": "plain_text", "text": label},
        "style": style,
        "action_id": action_id,
        "value": value,
    }


def encode_ctx(exc_id: str, rule: str, org: str, subject_type: str, subject_id: str, hours: str) -> str:
    payload = {
        "exc_id": exc_id,
        "rule_id": rule,
        "org_id": org,
        "subject_type": subject_type,
        "subject_id": subject_id,
        "hours": hours,
    }
    return json.dumps(payload)


def _fallback(value: str | None, default: str) -> str:
    value = (value or "").strip()
    return value if value else default


def approval_card(
    rule_id: str,
    org_id: str,
    subject_type: str,
    subject_id: str,
    reason: str,
    until: str | None,
    exc_id: str,
    requested_by: str,
) -> dict[str, Any]:
    spec: RuleSpec = load_rule(rule_id)
    owners_line = format_owners_line(spec.owners)
    header = {
        "type": "header",
        "text": {"type": "plain_text", "text": "Exception request"},
    }
    kvs = (
        f"*Rule:* `{rule_id}`\n"
        f"*Subject:* `{subject_type}:{subject_id}`\n"
        f"*Org:* `{org_id}`\n"
        f"*Until:* `{_fallback(until, '(none)')}`\n"
        f"*Requested by:* `{requested_by}`"
    )
    section_top = section(kvs)
    section_reason = section(f"*Reason:*\n{reason}")
    context_elements = [
        {"type": "mrkdwn", "text": owners_line},
    ]
    if spec.docs_url:
        context_elements.append({"type": "mrkdwn", "text": f"<{spec.docs_url}|Docs>"})
    context_elements.append({"type": "mrkdwn", "text": f"*ID:* `{exc_id}`"})
    context = {"type": "context", "elements": context_elements}
    actions = {
        "type": "actions",
        "elements": [
            button(
                "Approve 24h",
                "primary",
                "approve",
                encode_ctx(exc_id, rule_id, org_id, subject_type, subject_id, "24"),
            ),
            button(
                "Approve 72h",
                "primary",
                "approve72",
                encode_ctx(exc_id, rule_id, org_id, subject_type, subject_id, "72"),
            ),
            button(
                "Deny",
                "danger",
                "deny",
                encode_ctx(exc_id, rule_id, org_id, subject_type, subject_id, ""),
            ),
        ],
    }
    return {
        "blocks": [header, section_top, section_reason, context, actions],
    }


def prepend_duplicate_notice(card: dict[str, Any]) -> None:
    """Insert a warning section when a duplicate was encountered."""

    warning = section(":warning: Existing open exception found; re-using it.")
    blocks = card.get("blocks")
    if isinstance(blocks, list):
        card["blocks"] = [warning, *blocks]
    else:  # pragma: no cover - defensive
        card["blocks"] = [warning]
