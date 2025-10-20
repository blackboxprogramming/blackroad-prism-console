"""Lightweight status broadcaster for agent orchestration."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Callable, Dict, Mapping, Optional

LOGGER = logging.getLogger(__name__)


class StatusBroadcaster:
    """Emit structured status events and chat-friendly notifications."""

    def __init__(self, channel: str, sink: Callable[[str], None] | None = None) -> None:
        self.channel = channel
        self._sink = sink or LOGGER.info

    def emit(
        self,
        *,
        agent: str,
        status: str,
        owner: str,
        task: str,
        next_step: Optional[str],
        links: Mapping[str, Optional[str]] | None = None,
    ) -> Dict[str, Any]:
        event = {
            "agent": agent,
            "status": status,
            "owner": owner,
            "task": task,
            "next_step": next_step,
            "links": dict(links or {}),
            "channel": self.channel,
            "ts": datetime.utcnow().isoformat(),
        }
        LOGGER.info("status_event", extra={"event": event})
        message = self.format_message(event)
        self._sink(message)
        return event

    def format_message(self, event: Mapping[str, Any]) -> str:
        next_step = event.get("next_step") or "awaiting input"
        trace_link = (event.get("links") or {}).get("trace")
        link_text = f"\ntrace: {trace_link}" if trace_link else ""
        return (
            f"[{event.get('agent')}] {event.get('status')} → {event.get('task')}\n"
            f"next: {next_step} • owner: @{event.get('owner')}" + link_text
        )


__all__ = ["StatusBroadcaster"]
