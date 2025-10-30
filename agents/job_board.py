"""Simple job board for agent tasks."""

from __future__ import annotations

from pathlib import Path
from typing import List, Optional


class JobBoard:
    """Read and manipulate tasks from ``AGENT_WORKBOARD.md``."""
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

    def assign_next_task(self, assignee: str) -> Optional[str]:
        """Move the next task into the "In Progress" section with the given assignee.

        Returns the task description, or ``None`` if no tasks remain.
        """

        lines = self.path.read_text().splitlines()

        todo_start: Optional[int] = None
        todo_end: Optional[int] = None
        in_progress_start: Optional[int] = None

        for idx, line in enumerate(lines):
            if line.startswith("## To Do"):
                todo_start = idx + 1
                continue
            if line.startswith("## In Progress"):
                in_progress_start = idx
                if todo_start is not None and todo_end is None:
                    todo_end = idx
                continue
            if line.startswith("##") and todo_start is not None and todo_end is None:
                todo_end = idx

        if todo_start is None:
            return None
        if todo_end is None:
            todo_end = len(lines)
        if in_progress_start is None:
            return None

        task_line_index: Optional[int] = None
        task_text: Optional[str] = None
        for idx in range(todo_start, todo_end):
            line = lines[idx]
            if line.strip().startswith("- [ ]"):
                task_line_index = idx
                task_text = line.split("]", 1)[1].strip()
                break

        if task_line_index is None or task_text is None:
            return None

        del lines[task_line_index]

        insert_idx = in_progress_start + 1
        while insert_idx < len(lines) and lines[insert_idx].strip().startswith("<!--"):
            insert_idx += 1
        while insert_idx < len(lines) and lines[insert_idx].strip() == "":
            insert_idx += 1

        assignment_line = f"- [ ] {task_text} (owner: {assignee})"
        lines.insert(insert_idx, assignment_line)

        self.path.write_text("\n".join(lines) + "\n")
        return task_text


if __name__ == "__main__":
    board = JobBoard()
    print("Next task:", board.next_task() or "No tasks found.")
