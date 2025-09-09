#!/usr/bin/env python3
"""
Guardian Agent

Listens for new events and contradictions, applies policy logic to enforce
truth filtering and contradiction escalation, and interacts with other agents
such as Roadie. This agent runs in a loop and should be supervised by an
external process manager (systemd, supervisord, etc.).
"""

import json
import time
from pathlib import Path
from typing import Any, Dict

STATE_DIR = Path("/srv/lucidia/state")
EVENT_LOG_PATH = STATE_DIR / "events.log"
CONTRA_PATH = STATE_DIR / "contradictions.log"


class Guardian:
    def __init__(self):
        self.event_pos = 0
        self.contra_pos = 0

    def tail_file(self, path: Path, last_pos: int) -> (list, int):
        if not path.exists():
            return [], last_pos
        with open(path, "r", encoding="utf-8") as f:
            f.seek(last_pos)
            lines = f.readlines()
            last_pos = f.tell()
        return [line.strip() for line in lines], last_pos

    def handle_event(self, rec: Dict[str, Any]) -> None:
        kind = rec.get("kind")
        if kind == "contradiction":
            return
        print(f"[guardian] Event: {rec}")

    def handle_contra(self, rec: Dict[str, Any]) -> None:
        print(f"[guardian] CONTRADICTION flagged: {rec.get('context')}")

    def loop(self, poll_interval: float = 2.0) -> None:
        while True:
            events, self.event_pos = self.tail_file(EVENT_LOG_PATH, self.event_pos)
            for line in events:
                try:
                    rec = json.loads(line)
                    self.handle_event(rec)
                except Exception:
                    continue

            contras, self.contra_pos = self.tail_file(CONTRA_PATH, self.contra_pos)
            for line in contras:
                try:
                    rec = json.loads(line)
                    self.handle_contra(rec)
                except Exception:
                    continue

            time.sleep(poll_interval)


def main():
    g = Guardian()
    g.loop()


if __name__ == "__main__":
    main()
