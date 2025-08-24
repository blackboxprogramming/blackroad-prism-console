#!/usr/bin/env python3
"""Codex build orchestrator for BlackRoad.io.

This script provides a chat-friendly interface for executing common
end-to-end tasks in the BlackRoad deployment pipeline.  Each command is a
step toward the goal of pushing repository changes through GitHub,
connector jobs, working copy refreshes, and droplet deployments.

The current implementation focuses on scaffolding.  Networking calls to
external services (Slack, Salesforce, Airtable, etc.) are left as
placeholders so the pipeline can be extended incrementally.
"""

from __future__ import annotations

import argparse
import shlex
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Iterable


def run(cmd: str, cwd: Path | None = None, dry_run: bool = False) -> None:
    """Run a shell command and stream output.

    Parameters
    ----------
    cmd:
        Command to execute.
    cwd:
        Working directory for the command.
    dry_run:
        If ``True`` the command is printed but not executed.
    """

    print(f"$ {cmd}")
    if dry_run:
        return
    subprocess.run(shlex.split(cmd), check=True, cwd=cwd)


# ---------------------------------------------------------------------------
# GitHub / repo operations
# ---------------------------------------------------------------------------


def push_latest(dry_run: bool = False) -> None:
    """Push local commits and trigger deployment."""
    run("git push", dry_run=dry_run)
    deploy_to_droplet(dry_run=dry_run)


def refresh_working_copy(dry_run: bool = False) -> None:
    """Pull the latest changes into the working copy."""
    run("git pull --ff-only", dry_run=dry_run)


def rebase_branch(branch: str = "main", dry_run: bool = False) -> None:
    """Rebase the current branch onto the specified branch."""
    run(f"git fetch origin {branch}", dry_run=dry_run)
    run(f"git rebase origin/{branch}", dry_run=dry_run)


# ---------------------------------------------------------------------------
# Connector and deployment placeholders
# ---------------------------------------------------------------------------


def sync_connectors(dry_run: bool = False) -> None:
    """Synchronise external connectors (Salesforce, Airtable, etc.).

    This is a placeholder for OAuth setup and webhook processing.  Extend
    this function with project-specific connector logic as needed.
    """

    print("[connectors] TODO: implement OAuth and webhook logic")


def _log(message: str, logfile: Path) -> None:
    timestamp = datetime.utcnow().isoformat()
    logfile.parent.mkdir(parents=True, exist_ok=True)
    with logfile.open("a", encoding="utf-8") as fh:
        fh.write(f"{timestamp} {message}\n")


def deploy_to_droplet(dry_run: bool = False) -> None:
    """Deploy the latest code to the droplet."""

    deploy_log = Path("deploy.log")
    error_log = Path("deploy_errors.log")

    paths: Iterable[tuple[str, str]] = [
        ("var/www/blackroad/", "/var/www/blackroad/"),
        ("srv/blackroad-api/", "/srv/blackroad-api/"),
        ("srv/lucidia-llm/", "/srv/lucidia-llm/"),
        ("srv/lucidia-math/", "/srv/lucidia-math/"),
    ]

    try:
        _log("Starting deployment", deploy_log)
        for local, remote in paths:
            cmd = f"rsync -az {local} blackroad.io:{remote}"
            _log(f"Sync {local} -> {remote}", deploy_log)
            run(cmd, dry_run=dry_run)

        _log("Restarting services", deploy_log)
        run(
            "ssh blackroad.io sudo systemctl restart blackroad-api lucidia-llm lucidia-math",
            dry_run=dry_run,
        )
        run("ssh blackroad.io sudo systemctl reload nginx", dry_run=dry_run)
        _log("Deployment complete", deploy_log)
    except (subprocess.CalledProcessError, OSError) as exc:
        _log(f"Deployment failed: {exc}", error_log)
        raise


# ---------------------------------------------------------------------------
# Chat-first control surface
# ---------------------------------------------------------------------------


def handle_command(cmd: str, dry_run: bool = False) -> None:
    actions = {
        "push": lambda: push_latest(dry_run=dry_run),
        "refresh": lambda: refresh_working_copy(dry_run=dry_run),
        "rebase": lambda: rebase_branch(dry_run=dry_run),
        "sync": lambda: sync_connectors(dry_run=dry_run),
    }
    action = actions.get(cmd)
    if action:
        action()
    else:
        print(f"Unknown command: {cmd}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Codex build pipeline")
    parser.add_argument("command", help="push|refresh|rebase|sync")
    parser.add_argument(
        "branch",
        nargs="?",
        default="main",
        help="branch name for rebase (default: main)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print commands without executing",
    )
    args = parser.parse_args()

    if args.command == "rebase":
        rebase_branch(args.branch, dry_run=args.dry_run)
    else:
        handle_command(args.command, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
