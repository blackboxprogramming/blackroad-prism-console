"""Bot that retrieves tasks from the job board."""

from __future__ import annotations

from typing import Optional
import sys
from pathlib import Path

AGENTS_DIR = Path(__file__).resolve().parent
if str(AGENTS_DIR) not in sys.path:
    sys.path.append(str(AGENTS_DIR))

from job_board import JobBoard


class WorkerBot:
    """Assign itself the next available job."""

    def __init__(self, name: str = "WorkerBot") -> None:
        self.name = name

    def work(self) -> str:
        """Assign the next available task and return its description.

        If no tasks remain, ``"idle"`` is returned.
        """

        board = JobBoard()
        task: Optional[str] = board.assign_next_task(self.name)
        """Return the task the bot will work on or ``"idle"``."""
        board = JobBoard()
        task: Optional[str] = board.next_task()
        return task or "idle"


if __name__ == "__main__":
    bot = WorkerBot()
    print(f"{bot.name} task:", bot.work())
