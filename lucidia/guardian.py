#!/usr/bin/env python3
"""Guardian Agent

Listens for new events and contradictions, applies policy logic to enforce
truth filtering and contradiction escalation, and interacts with other agents
such as Roadie. This agent runs in a loop and should be supervised by an
external process manager (systemd, supervisord, etc.).
"""

from __future__ import annotations

import time
from typing import Any, Iterable, Mapping, Optional

from prism_event_bridge import fetch_events


class Guardian:
    def __init__(self) -> None:
        self.cursor: Optional[str] = None

    def handle_event(self, record: Mapping[str, Any]) -> None:
        topic = record.get("topic", "?")
        payload = record.get("payload", {})
        kpis = record.get("kpis")
        memory_deltas = record.get("memory_deltas")
        print(f"[guardian] event {topic}: {payload}")
        if kpis:
            print(f"[guardian]  KPIs: {kpis}")
        if isinstance(memory_deltas, Iterable):
            for delta in memory_deltas:
                print(f"[guardian]  memory delta: {delta}")

    def loop(self, poll_interval: float = 2.0) -> None:
        while True:
            events, cursor = fetch_events(since=self.cursor)
            if cursor:
                self.cursor = cursor
            for record in events:
                try:
                    self.handle_event(record)
                except Exception as exc:  # noqa: BLE001 - Guardian must keep running
                    print(f"[guardian] failed to handle event: {exc}")
            time.sleep(poll_interval)


def main() -> None:
    guardian = Guardian()
    guardian.loop()


if __name__ == "__main__":
    main()
