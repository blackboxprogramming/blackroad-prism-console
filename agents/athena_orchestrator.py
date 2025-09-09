"""Athena: Project Orchestrator Agent

Athena coordinates all agents, manages the workboard, and sends notifications.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from notification_bot import NotificationBot

WORKBOARD_PATH = Path(__file__).resolve().parent.parent / "AGENT_WORKBOARD.md"


def update_workboard(section: str, task: str, status: str = "") -> None:
    """Move a task between sections and optionally append status."""
    if not WORKBOARD_PATH.exists():
        return
    lines = WORKBOARD_PATH.read_text().splitlines(keepends=True)
    sections = {"To Do": [], "In Progress": [], "Blocked": [], "Done": []}
    current = None
    for line in lines:
        if line.startswith("## "):
            current = line[3:].strip()
        elif current in sections and line.strip().startswith("- ["):
            sections[current].append(line)
    for key in sections:
        sections[key] = [l for l in sections[key] if task not in l]
    if section in sections:
        status_str = f" ({status})" if status else ""
        task_line = (
            f"- [ ] {task}{status_str}\n" if section != "Done" else f"- [x] {task}{status_str}\n"
        )
        sections[section].append(task_line)
    out = ["# Agent Workboard\n\n"]
    for sec in ["To Do", "In Progress", "Blocked", "Done"]:
        out.append(f"## {sec}\n")
        out.extend(sections[sec])
        out.append("\n")
    out.append("## Last Status Report\n")
    out.append(f"- {task} moved to {section} {status}\n")
    WORKBOARD_PATH.write_text("".join(out))


@dataclass
class AthenaOrchestrator:
    """Coordinate tasks, update workboard, and send notifications."""

    notification_bot: Optional[NotificationBot] = None

    def assign_task(self, task: str) -> None:
        update_workboard("To Do", task)
        self.notify(f"Athena assigned new task: {task}")

    def start_task(self, task: str) -> None:
        update_workboard("In Progress", task)
        self.notify(f"Athena started task: {task}")

    def complete_task(self, task: str) -> None:
        update_workboard("Done", task)
        self.notify(f"Athena completed task: {task}")

    def block_task(self, task: str, error: str = "") -> None:
        update_workboard("Blocked", task, error)
        self.notify(f"Athena blocked task: {task} ({error})")

    def notify(self, message: str) -> None:
        if self.notification_bot:
            self.notification_bot.send(message)
        print(message)


if __name__ == "__main__":
    athena = AthenaOrchestrator(notification_bot=NotificationBot())
    print("Athena Orchestrator ready to manage your project and agents!")
