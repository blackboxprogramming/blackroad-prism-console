"""Bot that reports whether tasks are available."""

from __future__ import annotations

import sys
from pathlib import Path

AGENTS_DIR = Path(__file__).resolve().parent
if str(AGENTS_DIR) not in sys.path:
    sys.path.append(str(AGENTS_DIR))

from job_board import JobBoard


class IdleBot:
    """Notify if the job board has no tasks."""

    def status(self) -> str:
        """Return ``"tasks available"`` or ``"idle"``."""
        board = JobBoard()
        return "tasks available" if board.next_task() else "idle"


if __name__ == "__main__":
    bot = IdleBot()
    print("IdleBot status:", bot.status())
