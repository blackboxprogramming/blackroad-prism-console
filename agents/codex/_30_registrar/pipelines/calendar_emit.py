"""ICS generation for the compliance calendar."""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence
from zoneinfo import ZoneInfo

import yaml

from .assemble_filing import load_entities, load_licenses

ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = ROOT / "rules" / "compliance_rules.yaml"
CONFIG_PATH = ROOT / "codex30.yaml"


@dataclass
class ComplianceRule:
    """Single compliance rule entry."""

    rule_id: str
    jurisdiction: str
    name: str
    month: int
    day: int
    lead_days: int
    entities: Sequence[str]
    licenses: Sequence[str]
    packet: Optional[str] = None

    @classmethod
    def from_dict(cls, payload: Dict[str, object]) -> "ComplianceRule":
        return cls(
            rule_id=str(payload["id"]),
            jurisdiction=str(payload.get("jurisdiction", "")),
            name=str(payload.get("name", "")),
            month=int(payload.get("month", 1)),
            day=int(payload.get("day", 1)),
            lead_days=int(payload.get("lead_days", 0)),
            entities=tuple(payload.get("entities", []) or []),
            licenses=tuple(payload.get("licenses", []) or []),
            packet=payload.get("packet"),
        )


@dataclass
class CalendarConfig:
    timezone: ZoneInfo
    tzid: str
    reminders: Sequence[str]

    @classmethod
    def load(cls, path: Path = CONFIG_PATH) -> "CalendarConfig":
        with path.open("r", encoding="utf-8") as handle:
            payload = yaml.safe_load(handle) or {}
        calendar_cfg = payload.get("calendar", {})
        tz_name = calendar_cfg.get("tz", "UTC")
        return cls(
            timezone=ZoneInfo(tz_name),
            tzid=tz_name,
            reminders=calendar_cfg.get("reminders", []),
        )


def load_rules(path: Path = RULES_PATH) -> List[ComplianceRule]:
    with path.open("r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle) or []
    return [ComplianceRule.from_dict(entry) for entry in payload]


def generate_calendar(year: int, *, data_dir: Optional[Path] = None) -> str:
    """Generate an ICS file for the requested year."""

    config = CalendarConfig.load()
    entities = load_entities(data_dir)
    licenses = load_licenses(data_dir)

    events = []
    for rule in load_rules():
        event_date = dt.date(year, rule.month, rule.day)
        event = build_event(rule, event_date, config, entities, licenses)
        events.append(event)

    return render_ics(events, config)


def build_event(
    rule: ComplianceRule,
    event_date: dt.date,
    config: CalendarConfig,
    entities: Dict[str, dict],
    licenses: Dict[str, dict],
) -> Dict[str, object]:
    tz = config.timezone
    start = dt.datetime.combine(event_date, dt.time(9, 0), tzinfo=tz)
    end = start + dt.timedelta(hours=1)

    owners: List[str] = []
    for entity_id in rule.entities:
        entity = entities.get(entity_id)
        if entity:
            owners.append(entity.get("name", entity_id))
    for license_id in rule.licenses:
        license_record = licenses.get(license_id)
        if license_record:
            owners.append(f"License {license_id}")

    description_lines = [
        f"Jurisdiction: {rule.jurisdiction}",
        f"Owners: {', '.join(owners) if owners else 'Unassigned'}",
    ]
    if rule.packet:
        description_lines.append(f"Receipt: {rule.packet}")

    return {
        "uid": f"{rule.rule_id}-{event_date.year}@registrar.blackroad",
        "summary": f"{rule.name} ({rule.jurisdiction})",
        "start": start,
        "end": end,
        "description": "\\n".join(description_lines),
        "reminders": list(config.reminders),
        "url": rule.packet,
        "lead_days": rule.lead_days,
    }


def render_ics(events: Iterable[Dict[str, object]], config: CalendarConfig) -> str:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//BlackRoad//Codex-30 Registrar//EN",
        f"CALSCALE:GREGORIAN",
    ]

    for event in events:
        lines.extend(render_event(event, config))

    lines.append("END:VCALENDAR")
    return "\n".join(lines) + "\n"


def render_event(event: Dict[str, object], config: CalendarConfig) -> List[str]:
    start: dt.datetime = event["start"]
    end: dt.datetime = event["end"]
    uid = event["uid"]
    summary = event["summary"]
    description = event.get("description", "")
    url = event.get("url")

    lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTART;TZID={config.tzid}:{_format_dt(start)}",
        f"DTEND;TZID={config.tzid}:{_format_dt(end)}",
        f"SUMMARY:{_escape(summary)}",
        f"DESCRIPTION:{_escape(description)}",
    ]
    if url:
        lines.append(f"URL:{_escape(url)}")

    for reminder in event.get("reminders", []):
        trigger = _format_trigger(reminder)
        lines.extend(
            [
                "BEGIN:VALARM",
                f"TRIGGER:{trigger}",
                "ACTION:DISPLAY",
                f"DESCRIPTION:{_escape(summary)}",
                "END:VALARM",
            ]
        )

    lines.append("END:VEVENT")
    return lines


def _format_dt(value: dt.datetime) -> str:
    return value.strftime("%Y%m%dT%H%M%S")


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")


def _format_trigger(value: str) -> str:
    value = value.strip()
    if value[0] != "-":
        raise ValueError("Only negative reminders are supported")
    quantity = value[1:-1]
    unit = value[-1]
    if unit == "d":
        return f"-P{int(quantity)}D"
    if unit == "h":
        return f"-PT{int(quantity)}H"
    raise ValueError(f"Unsupported reminder unit: {value}")


def due_events(
    *,
    today: Optional[dt.date] = None,
    window_days: int = 7,
    data_dir: Optional[Path] = None,
) -> List[Dict[str, object]]:
    """Return rule metadata for events due within the window."""

    config = CalendarConfig.load()
    entities = load_entities(data_dir)
    licenses = load_licenses(data_dir)
    today = today or dt.date.today()
    window_end = today + dt.timedelta(days=window_days)

    upcoming: List[Dict[str, object]] = []
    candidates: List[Dict[str, object]] = []
    for rule in load_rules():
        event_date = dt.date(today.year, rule.month, rule.day)
        if event_date < today:
            event_date = dt.date(today.year + 1, rule.month, rule.day)
        event = build_event(rule, event_date, config, entities, licenses)
        lead_date = (event["start"] - dt.timedelta(days=event.get("lead_days", 0))).date()
        if today <= lead_date <= window_end or today <= event_date <= window_end:
            upcoming.append(event)
        candidates.append(event)

    if not upcoming and candidates:
        upcoming.append(candidates[0])

    return upcoming
