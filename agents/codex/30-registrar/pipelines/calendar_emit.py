"""Compliance calendar generation for Codex-30 Registrar."""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Dict, Iterable, List, Sequence

from .assemble_filing import build_packets_for_entities, load_entities, load_licenses, load_rules
from .validate_compliance import validate_event

DEFAULT_REMINDERS = ["-14d", "-7d", "-3d", "-1d", "-2h"]
PRODID = "-//BlackRoad//Codex-30 Registrar//EN"


def _parse_offset(offset: str) -> timedelta:
    if not offset:
        return timedelta()
    sign = -1 if offset.startswith("-") else 1
    value = int(offset.strip("-+dh"))
    if offset.endswith("d"):
        return timedelta(days=sign * value)
    if offset.endswith("h"):
        return timedelta(hours=sign * value)
    raise ValueError(f"unsupported offset: {offset}")


def _select_config(jurisdiction: str, renewal_cycle: str, rules: Dict[str, Dict]) -> Dict:
    per_jurisdiction = rules.get("jurisdictions", {}).get(jurisdiction, {})
    if not per_jurisdiction:
        return {
            "summary": f"{jurisdiction} {renewal_cycle.title()} compliance",
            "reminders": DEFAULT_REMINDERS,
            "attachments": [],
        }
    for config in per_jurisdiction.values():
        if config.get("cycle") == renewal_cycle:
            return config
    # default to first config available
    return next(iter(per_jurisdiction.values()))


def _merge_reminders(entity_overrides: Dict, config: Dict) -> List[str]:
    overrides = (entity_overrides or {}).get("reminders")
    if overrides:
        return list(overrides)
    reminders = config.get("reminders") or DEFAULT_REMINDERS
    return list(reminders)


def _event_uid(entity_id: str, jurisdiction: str, due: str) -> str:
    token = due.replace('-', '')
    return f"{entity_id.lower()}-{jurisdiction.lower()}-{token}@codex30"


def _sanitize_description(text: str) -> str:
    return text.replace("\n", "\\n")


def _build_event(
    entity: Dict,
    license_record: Dict,
    packet: Dict,
    rules: Dict,
) -> Dict[str, any]:
    config = _select_config(license_record["jurisdiction"], license_record.get("renewal_cycle", "annual"), rules)
    reminders = _merge_reminders(entity.get("calendar_overrides", {}), config)
    attachments = list(config.get("attachments", []))
    attachments.append(f"packet://{packet['id']}")
    for receipt in packet.get("receipts", []):
        attachments.append(f"receipt://{receipt['topic']}#{receipt['hash']}")

    summary = config.get("summary") or f"{license_record['jurisdiction']} compliance"
    description_lines = [
        summary,
        f"Entity: {entity['legal_name']}",
        f"Jurisdiction: {license_record['jurisdiction']}",
        f"Packet: {packet['id']}",
    ]
    sanitized_contacts = packet.get("_sanitized_contacts", {})
    officer = sanitized_contacts.get("officer", {}) if isinstance(sanitized_contacts, dict) else {}
    if officer:
        description_lines.append(f"Officer: {officer.get('name', '[REDACTED]')}")
    description = _sanitize_description("\n".join(description_lines))

    due = license_record["renewal_due"]
    if hasattr(due, 'isoformat'):
        due = due.isoformat()
    event = {
        "uid": _event_uid(entity["id"], license_record["jurisdiction"], due),
        "summary": summary,
        "description": description,
        "start": due,
        "due": due,
        "jurisdiction": license_record["jurisdiction"],
        "attachments": attachments,
        "reminders": reminders,
        "packet_reference": packet["id"],
    }

    validate_event(event)
    return event


def generate_events(
    entities: Sequence[Dict],
    licenses: Sequence[Dict],
    packets: Sequence[Dict],
    rules: Dict | None = None,
) -> List[Dict]:
    """Generate calendar events for the supplied inputs."""

    rules = rules or load_rules()
    packet_index = {packet["entity_id"]: packet for packet in packets}
    entity_index = {entity["id"]: entity for entity in entities}

    events: List[Dict] = []
    for license_record in licenses:
        entity = entity_index.get(license_record["entity_id"])
        if not entity:
            continue
        packet = packet_index.get(entity["id"])
        if not packet:
            continue
        events.append(_build_event(entity, license_record, packet, rules))
    return events


def emit_ics(events: Iterable[Dict], tzid: str = "America/Chicago") -> str:
    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODID}",
        f"X-WR-TIMEZONE:{tzid}",
    ]
    for event in events:
        lines.extend(_ics_event_lines(event, now))
    lines.append("END:VCALENDAR")
    return "\n".join(lines) + "\n"


def _ics_event_lines(event: Dict, dtstamp: str) -> List[str]:
    lines = [
        "BEGIN:VEVENT",
        f"UID:{event['uid']}",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART;VALUE=DATE:{event['start'].replace('-', '')}",
        f"DUE;VALUE=DATE:{event['due'].replace('-', '')}",
        f"SUMMARY:{event['summary']}",
        f"DESCRIPTION:{event['description']}",
    ]
    for attachment in event.get("attachments", []):
        lines.append(f"ATTACH:{attachment}")
    for reminder in event.get("reminders", []):
        trigger = _offset_to_trigger(reminder)
        lines.extend([
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            f"TRIGGER:{trigger}",
            "DESCRIPTION:Reminder",
            "END:VALARM",
        ])
    lines.append("END:VEVENT")
    return lines


def _offset_to_trigger(offset: str) -> str:
    delta = _parse_offset(offset)
    if delta.days:
        return f"-P{abs(delta.days)}D"
    hours = abs(int(delta.total_seconds() // 3600))
    return f"-PT{hours}H"


def due_events(events: Sequence[Dict], *, horizon_days: int = 14, reference: date | None = None) -> List[Dict]:
    reference = reference or date.today()
    upcoming: List[Dict] = []
    for event in events:
        due = date.fromisoformat(event["due"])
        delta = (due - reference).days
        if 0 <= delta <= horizon_days:
            upcoming.append(event)
    return upcoming


def generate_and_emit(master_key: str | None = None) -> str:
    """Convenience helper: builds packets, generates events, and returns ICS text."""

    entities = load_entities()
    licenses = load_licenses()
    packets = build_packets_for_entities(entities, licenses, master_key=master_key or "codex-30-registry")
    events = generate_events(entities, licenses, packets)
    return emit_ics(events)


__all__ = [
    "DEFAULT_REMINDERS",
    "due_events",
    "emit_ics",
    "generate_and_emit",
    "generate_events",
]
