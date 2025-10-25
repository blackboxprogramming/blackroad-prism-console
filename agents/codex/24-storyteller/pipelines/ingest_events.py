"""Utilities for loading raw activity into Storyteller episodes."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, List, Sequence
import json


@dataclass
class Event:
    """Canonical view of a story-relevant event."""

    source: str
    kind: str
    payload: dict


def load_event_logs(paths: Sequence[Path]) -> List[Event]:
    """Load newline-delimited JSON event logs into Event objects."""

    events: List[Event] = []
    for path in paths:
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                raw = json.loads(line)
                events.append(
                    Event(
                        source=str(path),
                        kind=raw.get("type", "unknown"),
                        payload=raw,
                    )
                )
    return events


def select_story_beats(events: Iterable[Event], *, min_importance: int = 5) -> Iterator[Event]:
    """Yield events whose payload importance meets the Storyteller threshold."""

    for event in events:
        importance = int(event.payload.get("importance", 0))
        if importance >= min_importance:
            yield event
