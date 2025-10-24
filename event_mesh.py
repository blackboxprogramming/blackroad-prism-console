from __future__ import annotations
import json
from dataclasses import dataclass
from typing import Callable, List, Dict, Any


@dataclass
class EventEnvelope:
    source: str
    type: str
    payload: Dict[str, Any]
    headers: Dict[str, Any]


class InMemoryEventBus:
    def __init__(self):
        self.handlers: List[Callable[[EventEnvelope], None]] = []

    def subscribe(self, handler: Callable[[EventEnvelope], None]):
        self.handlers.append(handler)

    def publish(self, evt: EventEnvelope):
        for h in list(self.handlers):
            h(evt)


def github_webhook_to_event(body: str) -> EventEnvelope:
    data = json.loads(body)
    etype = (
        data.get("event")
        or data.get("type")
        or (data.get("headers") or {}).get("X-GitHub-Event")
        or "push"
    )
    payload = data
    event_type = f"github.{etype}"

    if etype == "delete" and payload.get("ref_type") == "branch":
        payload.setdefault("branch", payload.get("ref"))
        payload.setdefault(
            "actor",
            (payload.get("sender") or {}).get("login") or payload.get("actor"),
        )
        event_type = "github.branch.deleted"

    return EventEnvelope(source="github", type=event_type, payload=payload, headers={})


def salesforce_webhook_to_event(body: str) -> EventEnvelope:
    data = json.loads(body)
    etype = data.get("type")
    return EventEnvelope(source="salesforce", type=f"salesforce.{etype}", payload=data, headers={})
