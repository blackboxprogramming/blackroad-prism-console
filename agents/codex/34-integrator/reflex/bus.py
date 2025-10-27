"""Lightweight event bus used for local reflex hooks."""
from __future__ import annotations

from collections import defaultdict
from typing import Any, Callable, DefaultDict, Dict, List

Handler = Callable[[Dict[str, Any]], None]


class EventBus:
    """Minimal synchronous event bus suitable for tests."""

    def __init__(self) -> None:
        self._handlers: DefaultDict[str, List[Handler]] = defaultdict(list)

    def on(self, event_name: str) -> Callable[[Handler], Handler]:
        def decorator(func: Handler) -> Handler:
            self._handlers[event_name].append(func)
            return func

        return decorator

    def emit(self, event_name: str, payload: Dict[str, Any]) -> None:
        for handler in list(self._handlers[event_name]):
            handler(payload)


BUS = EventBus()


__all__ = ["BUS", "EventBus"]
