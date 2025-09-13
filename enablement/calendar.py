from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import List

from tools import artifacts, storage

from .utils import ART, ROOT, lake_write, record


@dataclass
class Event:
    id: str
    title: str
    type: str
    date: str
    owner: str
    capacity: int
    attendees: List[str]


def _next_id(events: List[dict]) -> str:
    return f"EV{len(events)+1:03d}"


def add_event(title: str, type: str, date_str: str, capacity: int, owner: str = "system") -> Event:
    raw = storage.read(str(ART / "events.json"))
    data = json.loads(raw) if raw else []
    for e in data:
        if e["date"] == date_str and e["type"] == type:
            raise ValueError("conflict")
    ev = Event(_next_id(data), title, type, date_str, owner, capacity, [])
    data.append(asdict(ev))
    artifacts.validate_and_write(
        str(ART / "events.json"), data, str(ROOT / "contracts" / "schemas" / "events.json")
    )
    md = "\n".join(f"- {e['id']}: {e['title']} {e['date']}" for e in data)
    artifacts.validate_and_write(str(ART / "events.md"), md)
    lake_write("events", asdict(ev))
    record("events_created", 1)
    return ev


def join(event_id: str, user: str) -> None:
    raw = storage.read(str(ART / "events.json"))
    data = json.loads(raw) if raw else []
    event = next((e for e in data if e["id"] == event_id), None)
    if not event:
        raise ValueError("event not found")
    for e in data:
        if e["date"] == event["date"] and user in e.get("attendees", []):
            raise ValueError("conflict")
    if len(event.get("attendees", [])) >= event["capacity"]:
        raise ValueError("full")
    event.setdefault("attendees", []).append(user)
    artifacts.validate_and_write(
        str(ART / "events.json"), data, str(ROOT / "contracts" / "schemas" / "events.json")
    )
    lake_write("events", event)
