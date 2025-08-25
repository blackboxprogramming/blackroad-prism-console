"""Simple logging agent for the Prism system.

The :class:`LoggerAgent` writes messages to ``/prism/logs/logger.log`` and
records basic contradictions to ``/prism/contradictions/logger.json`` when the
message contains the word "contradiction".
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import json
from pathlib import Path
from typing import Dict

PRISM_ROOT = Path(__file__).resolve().parents[2] / "prism"
LOG_DIR = PRISM_ROOT / "logs"
CONTRA_DIR = PRISM_ROOT / "contradictions"


@dataclass
class LoggerAgent:
    """Minimal logger agent with contradiction tracking."""

    name: str = "logger"

    def _log_path(self) -> Path:
        return LOG_DIR / f"{self.name}.log"

    def _contra_path(self) -> Path:
        return CONTRA_DIR / f"{self.name}.json"

    def log(self, message: str) -> None:
        """Append ``message`` to the agent's log file."""
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().isoformat()
        with self._log_path().open("a", encoding="utf-8") as fh:
            fh.write(f"{timestamp} {message}\n")
        if "contradiction" in message.lower():
            self.record_contradiction({"timestamp": timestamp, "message": message})

    def record_contradiction(self, data: Dict[str, str]) -> None:
        """Write a contradiction entry as JSON line."""
        CONTRA_DIR.mkdir(parents=True, exist_ok=True)
        with self._contra_path().open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(data) + "\n")

    def run(self) -> None:
        """Basic IPC loop reading lines from ``stdin``."""
        try:
            while True:
                line = input()
                if not line:
                    continue
                self.log(line)
        except EOFError:
            # Gracefully handle EOF to signal shutdown of the agent
            self.log("EOF received; exiting")


if __name__ == "__main__":
    LoggerAgent().run()
