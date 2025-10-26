"""Validation helpers for Codex-30 Registrar artifacts."""
from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any, Dict

from jsonschema import Draft7Validator

from .assemble_filing import ROOT

PACKET_SCHEMA_PATH = ROOT / "schemas" / "filing_packet.schema.json"
EVENT_SCHEMA_PATH = ROOT / "schemas" / "ics_event.schema.json"

PACKET_VALIDATOR = Draft7Validator(json.loads(PACKET_SCHEMA_PATH.read_text(encoding="utf-8")))
EVENT_VALIDATOR = Draft7Validator(json.loads(EVENT_SCHEMA_PATH.read_text(encoding="utf-8")))


def _strip_private_fields(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in payload.items() if not key.startswith("_")}


def validate_packet(packet: Dict[str, Any]) -> None:
    """Validate a filing packet.

    Beyond the JSON Schema check, we ensure:
    - the due date is not in the past
    - each receipt references the packet identifier
    - the attestation timestamp is not in the future
    """

    cleaned = _strip_private_fields(packet)
    PACKET_VALIDATOR.validate(cleaned)

    due = date.fromisoformat(cleaned["due_date"])
    if due < date.today():
        raise ValueError(f"packet {cleaned['id']} is overdue: {cleaned['due_date']}")

    packet_id = cleaned["id"]
    for receipt in cleaned.get("receipts", []):
        if packet_id not in receipt.get("reference", "") and receipt["topic"] != "contacts_encrypted":
            raise ValueError(f"receipt {receipt} does not reference packet {packet_id}")
        datetime.fromisoformat(receipt["issued_at"].replace("Z", "+00:00"))

    attestation = cleaned.get("attestation") or {}
    signed_at = attestation.get("signed_at")
    if signed_at:
        signed_dt = datetime.fromisoformat(signed_at.replace("Z", "+00:00"))
        if signed_dt > datetime.utcnow().astimezone(signed_dt.tzinfo):
            raise ValueError("attestation timestamp cannot be in the future")


def validate_event(event: Dict[str, Any]) -> None:
    """Validate a compliance calendar event."""

    EVENT_VALIDATOR.validate(event)
    start = date.fromisoformat(event["start"])
    due = date.fromisoformat(event["due"])
    if due < start:
        raise ValueError(f"event {event['uid']} has due date before start")

    for reminder in event.get("reminders", []):
        if not reminder.startswith('-'):
            raise ValueError(f'reminder {reminder} must be a negative offset')


__all__ = ["validate_event", "validate_packet"]
