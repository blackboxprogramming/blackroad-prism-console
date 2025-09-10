#!/usr/bin/env python3
"""
Roadie Agent

This agent monitors the system state, performs routine checks (health, disk
usage, etc.), mints RoadCoins for contributions, and interacts with Guardian
and Codex. It is intended to run continuously as part of the multi-agent loop.
"""

import json
import shutil
import time
from pathlib import Path

STATE_DIR = Path("/srv/lucidia/state")
EVENT_LOG_PATH = STATE_DIR / "events.log"


class Roadie:
    def __init__(self):
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        self.last_health_check = 0.0

    def event(self, kind: str, payload: dict) -> None:
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        rec = {"ts": ts, "kind": kind, "payload": payload}
        with open(EVENT_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")

    def health_checks(self) -> None:
        total, used, free = shutil.disk_usage("/")
        payload = {
            "disk_total_gb": round(total / (1024**3), 2),
            "disk_used_gb": round(used / (1024**3), 2),
            "disk_free_gb": round(free / (1024**3), 2),
        }
        self.event("health.disk", payload)

    def mint_roadcoin(self, amount: float, reason: str) -> None:
        payload = {"amount": amount, "reason": reason}
        self.event("roadcoin.mint", payload)

    def loop(self, interval: float = 60.0) -> None:
        while True:
            now = time.time()
            if now - self.last_health_check > interval:
                self.health_checks()
                self.last_health_check = now
            self.mint_roadcoin(0.01, "heartbeat")
            time.sleep(interval)


def main():
    r = Roadie()
    r.loop()


if __name__ == "__main__":
    main()
