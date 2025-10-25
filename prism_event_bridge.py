"""Thin HTTP bridge to the Prism event bus."""

from __future__ import annotations

import json
import os
import sys
import time
from typing import Any, Dict, Iterable, List, Mapping, Optional, Tuple
from urllib import error, parse, request

_DEFAULT_ENDPOINT = os.environ.get("PRISM_EVENT_ENDPOINT", "http://localhost:3000/events")


def _log_failure(action: str, exc: Exception) -> None:
    print(f"[event-bridge] {action} failed: {exc}", file=sys.stderr)


def publish_event(
    topic: str,
    payload: Mapping[str, Any],
    *,
    actor: str = "system",
    at: Optional[str] = None,
    event_id: Optional[str] = None,
    kpis: Optional[Mapping[str, Any]] = None,
    memory_deltas: Optional[Iterable[Mapping[str, Any]]] = None,
    endpoint: str = _DEFAULT_ENDPOINT,
) -> None:
    """Publish an event to the Prism bus.

    Any network errors are logged and suppressed so callers can continue
    operating even when the bus is unavailable.
    """

    if not endpoint:
        return
    body: Dict[str, Any] = {
        "topic": topic,
        "payload": dict(payload),
        "actor": actor,
    }
    if at:
        body["at"] = at
    if event_id:
        body["id"] = event_id
    if kpis:
        body["kpis"] = dict(kpis)
    if memory_deltas:
        body["memory_deltas"] = [dict(delta) for delta in memory_deltas]

    data = json.dumps(body).encode("utf-8")
    req = request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    try:
        with request.urlopen(req, timeout=5):
            pass
    except error.URLError as exc:  # pragma: no cover - best effort network call
        _log_failure("publish", exc)


def fetch_events(
    *,
    since: Optional[str] = None,
    endpoint: str = _DEFAULT_ENDPOINT,
) -> Tuple[List[Mapping[str, Any]], Optional[str]]:
    """Fetch events from the Prism bus returning (events, cursor)."""

    if not endpoint:
        return [], None
    query = f"?since={parse.quote_plus(since)}" if since else ""
    req = request.Request(f"{endpoint}{query}")
    try:
        with request.urlopen(req, timeout=5) as resp:
            data = json.load(resp)
    except error.URLError as exc:  # pragma: no cover - best effort network call
        _log_failure("fetch", exc)
        return [], since
    events = data.get("events")
    if not isinstance(events, list):
        events = []
    cursor = data.get("cursor")
    if cursor is not None and not isinstance(cursor, str):
        cursor = None
    return events, cursor


def wait_for_event(
    topic_prefix: str,
    *,
    since: Optional[str] = None,
    timeout: float = 5.0,
    poll_interval: float = 0.5,
    endpoint: str = _DEFAULT_ENDPOINT,
) -> Optional[Mapping[str, Any]]:
    """Poll the bus until an event with the matching topic prefix arrives."""

    cursor = since
    deadline = time.time() + timeout
    while time.time() < deadline:
        events, cursor = fetch_events(since=cursor, endpoint=endpoint)
        for event in events:
            topic = event.get("topic")
            if isinstance(topic, str) and topic.startswith(topic_prefix):
                return event
        time.sleep(poll_interval)
    return None


__all__ = ["publish_event", "fetch_events", "wait_for_event"]
