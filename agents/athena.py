"""Athena orchestrates and coordinates agents while tracking progress.

This module defines the :class:`Athena` coordinator which manages the
execution of other agents and records their status in the shared workboard.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Sequence


@dataclass
class Athena:
    """Coordinate agent runs and updates the shared workboard."""

    workboard: Path = Path(__file__).resolve().parent.parent / "AGENT_WORKBOARD.md"

    def update_workboard(self, section: str, task: str, status: str = "") -> None:
        """Move a task between workboard sections and append status."""
        lines = self.workboard.read_text().splitlines(keepends=True)
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
                f"- [ ] {task}{status_str}\n"
                if section != "Done"
                else f"- [x] {task}{status_str}\n"
            )
            sections[section].append(task_line)
        out = ["# Agent Workboard\n\n"]
        for sec in ["To Do", "In Progress", "Blocked", "Done"]:
            out.append(f"## {sec}\n")
            out.extend(sections[sec])
            out.append("\n")
        out.append("## Last Status Report\n")
        out.append(f"- {datetime.utcnow()} {task} moved to {section} {status}\n")
        self.workboard.write_text("".join(out))

    def run_agent(self, cmd: Sequence[str], taskname: str) -> None:
        """Run a command and update workboard based on its result."""
        self.update_workboard("In Progress", taskname)
        try:
            subprocess.run(cmd, check=True)
            self.update_workboard("Done", taskname, "Success")
        except subprocess.CalledProcessError as exc:
            self.update_workboard("Blocked", taskname, f"Failed: {exc}")

    def orchestrate(self) -> None:
        """Run the standard build, deploy, and cleanup agents."""
        self.run_agent(
            ["python", "agents/build_blackroad_site_agent.py"],
            "Build site (`BuildBlackRoadSiteAgent`)",
        )
        self.run_agent(
            ["python", "agents/website_bot.py"],
            "Deploy site (`WebsiteBot`)",
        )
        self.run_agent(
            ["python", "agents/cleanup_bot.py", "--base", "main"],
            "Clean up merged branches (`CleanupBot`)",
        )


def main() -> None:
    """Entrypoint for running Athena orchestration."""
    Athena().orchestrate()


if __name__ == "__main__":
    main()
