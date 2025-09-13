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
    etype = data.get("event") or data.get("type") or "push"
    return EventEnvelope(source="github", type=f"github.{etype}", payload=data, headers={})


def salesforce_webhook_to_event(body: str) -> EventEnvelope:
    data = json.loads(body)
    etype = data.get("type")
    return EventEnvelope(source="salesforce", type=f"salesforce.{etype}", payload=data, headers={})
