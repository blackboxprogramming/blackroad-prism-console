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
from pathlib import Path


def run(cmd: str, cwd: Path | None = None) -> None:
    """Run a shell command and stream output."""
    print(f"$ {cmd}")
    subprocess.run(shlex.split(cmd), check=True, cwd=cwd)


# ---------------------------------------------------------------------------
# GitHub / repo operations
# ---------------------------------------------------------------------------

def push_latest() -> None:
    """Push local commits and trigger deployment."""
    run("git push")
    deploy_to_droplet()


def refresh_working_copy() -> None:
    """Pull the latest changes into the working copy."""
    run("git pull --ff-only")


def rebase_branch(branch: str = "main") -> None:
    """Rebase the current branch onto the specified branch."""
    run(f"git fetch origin {branch}")
    run(f"git rebase origin/{branch}")


# ---------------------------------------------------------------------------
# Connector and deployment placeholders
# ---------------------------------------------------------------------------

def sync_connectors() -> None:
    """Synchronise external connectors (Salesforce, Airtable, etc.).

    This is a placeholder for OAuth setup and webhook processing.  Extend
    this function with project-specific connector logic as needed.
    """

    print("[connectors] TODO: implement OAuth and webhook logic")


def deploy_to_droplet() -> None:
    """Deploy the latest code to the droplet.

    Actual deployment commands (git pull, migrations, service restarts)
    should be added here.  The function currently acts as a stub so the
    broader orchestration flow can be wired up without side effects.
    """

    print("[droplet] TODO: implement remote deployment commands")


# ---------------------------------------------------------------------------
# Chat-first control surface
# ---------------------------------------------------------------------------

def handle_command(cmd: str) -> None:
    actions = {
        "push": push_latest,
        "refresh": refresh_working_copy,
        "rebase": rebase_branch,
        "sync": sync_connectors,
    }
    action = actions.get(cmd)
    if action:
        action()
    else:
        print(f"Unknown command: {cmd}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Codex build pipeline")
    parser.add_argument("command", help="push|refresh|rebase|sync")
    parser.add_argument("branch", nargs="?", default="main",
                        help="branch name for rebase (default: main)")
    args = parser.parse_args()

    if args.command == "rebase":
        rebase_branch(args.branch)
    else:
        handle_command(args.command)


if __name__ == "__main__":
    main()
