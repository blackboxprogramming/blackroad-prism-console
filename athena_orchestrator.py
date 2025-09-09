"""Athena orchestrator for coordinating agents and updating workboard."""

from __future__ import annotations

import subprocess
from datetime import datetime
from pathlib import Path
from typing import Sequence

WORKBOARD = Path(__file__).resolve().parent / "AGENT_WORKBOARD.md"


def update_workboard(section: str, task: str, status: str = "") -> None:
    """Move a task between workboard sections and append status."""
    lines = WORKBOARD.read_text().splitlines(keepends=True)
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
        prefix = "- [ ]" if section != "Done" else "- [x]"
        sections[section].append(f"{prefix} {task}{status_str}\n")
    out = ["# Agent Workboard\n\n"]
    for sec in ["To Do", "In Progress", "Blocked", "Done"]:
        out.append(f"## {sec}\n")
        out.extend(sections[sec])
        out.append("\n")
    out.append("## Last Status Report\n")
    out.append(f"- {datetime.utcnow()} {task} moved to {section} {status}\n")
    WORKBOARD.write_text("".join(out))


def notify(message: str) -> None:
    """Placeholder for notification hub."""
    print(f"[ATHENA] {message}")


def run_agent(cmd: Sequence[str], taskname: str) -> None:
    """Run a command and update workboard based on its result."""
    update_workboard("In Progress", taskname)
    notify(f"Starting {taskname}")
    try:
        subprocess.run(cmd, check=True)
        update_workboard("Done", taskname, "Success")
        notify(f"Completed {taskname}")
    except subprocess.CalledProcessError as exc:
        update_workboard("Blocked", taskname, f"Failed: {exc}")
        notify(f"Failed {taskname}: {exc}")


def suggest_strategy() -> None:
    """Emit a simple strategy suggestion."""
    notify("Consider automating more checks and improving collaboration.")


def main() -> None:
    """Orchestrate build, deploy, and cleanup agents."""
    run_agent([
        "python",
        "agents/build_blackroad_site_agent.py",
    ], "Build site (`BuildBlackRoadSiteAgent`)")
    run_agent([
        "python",
        "agents/website_bot.py",
    ], "Deploy site (`WebsiteBot`)")
    run_agent([
        "python",
        "agents/cleanup_bot.py",
        "--base",
        "main",
    ], "Clean up merged branches (`CleanupBot`)")
    suggest_strategy()


if __name__ == "__main__":
    main()
