"""Translate raw events into narrative beats."""

from __future__ import annotations

from typing import Iterable, List, Mapping

from .ingest_events import Event


BEAT_ORDER = ["inciting", "complication", "insight", "decision", "consequence", "echo"]


def contradiction_to_beats(event: Mapping) -> List[Mapping[str, str]]:
    """Create a repair arc beat list from a Guardian contradiction event."""

    details = event.get("details", {})
    beats: List[Mapping[str, str]] = []
    beats.append({"name": "inciting", "summary": details.get("summary", "Contradiction detected.")})
    beats.append({"name": "complication", "summary": details.get("impact", "System flagged a tension.")})
    resolution = details.get("resolution")
    if resolution:
        beats.append({"name": "decision", "summary": resolution})
        beats.append({"name": "consequence", "summary": details.get("follow_up", "Repair work initiated." )})
    beats.append({"name": "echo", "summary": details.get("lesson", "Capture the learning.")})
    return beats


def map_events_to_beats(events: Iterable[Event]) -> List[dict]:
    """Bucket incoming events across the canonical beat order."""

    beats_by_kind: dict[str, List[Event]] = {key: [] for key in BEAT_ORDER}
    for event in events:
        kind = event.payload.get("beat")
        if kind in beats_by_kind:
            beats_by_kind[kind].append(event)
    return [
        {
            "name": name,
            "events": [evt.payload for evt in beats_by_kind[name]],
        }
        for name in BEAT_ORDER
        if beats_by_kind[name]
    ]
