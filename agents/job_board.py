"""Simple job board for agent tasks."""

from __future__ import annotations

from pathlib import Path
from typing import List, Optional


class JobBoard:
    """Read and provide tasks from ``AGENT_WORKBOARD.md``."""

    def __init__(self, path: Optional[Path] = None) -> None:
        self.path = path or Path(__file__).resolve().parents[1] / "AGENT_WORKBOARD.md"

    def tasks(self) -> List[str]:
        """Return a list of pending task descriptions."""
        lines = self.path.read_text().splitlines()
        in_todo = False
        tasks: List[str] = []
        for line in lines:
            if line.startswith("## To Do"):
                in_todo = True
                continue
            if line.startswith("##") and in_todo:
                break
            if in_todo and line.strip().startswith("- [ ]"):
                task = line.split("]", 1)[1].strip()
                tasks.append(task)
        return tasks

    def next_task(self) -> Optional[str]:
        """Return the next pending task or ``None`` if none exist."""
        tasks = self.tasks()
        return tasks[0] if tasks else None


if __name__ == "__main__":
    board = JobBoard()
    print("Next task:", board.next_task() or "No tasks found.")
