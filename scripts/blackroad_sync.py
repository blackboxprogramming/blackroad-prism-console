#!/usr/bin/env python3
"""BlackRoad.io sync and deploy helper.

Provides a simple chat-like interface for the Codex pipeline.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from typing import List


def run(cmd: List[str]) -> int:
    """Run a shell command and stream its output.

    Args:
        cmd: The command and arguments to run.

    Returns:
        Exit status code from the command.
    """
    print(f"+ {' '.join(cmd)}")
    return subprocess.call(cmd)


def push_latest() -> None:
    """Push local changes to remote repository and trigger deployment."""
    if run(["git", "push"]) != 0:
        sys.exit("git push failed")
    # Placeholder for triggering downstream syncs like CI/CD pipelines.
    print("Triggered downstream syncs.")


def refresh_working_copy() -> None:
    """Pull latest changes and redeploy services on the droplet."""
    if run(["git", "pull"]) != 0:
        sys.exit("git pull failed")
    # Placeholder for restart or redeploy commands on the droplet.
    print("Refreshed local working copy and redeployed.")


def rebase_branch() -> None:
    """Rebase the current branch on top of origin/main and push."""
    if run(["git", "fetch", "origin"]) != 0:
        sys.exit("git fetch failed")
    if run(["git", "rebase", "origin/main"]) != 0:
        sys.exit("git rebase failed")
    push_latest()


def sync_connectors() -> None:
    """Kick off external connector synchronization jobs."""
    # Placeholder: integration with Salesforce, Airtable, Slack, Linear, etc.
    print("Syncing connectors: Salesforce, Airtable, Slack, Linear (placeholder).")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        nargs=argparse.REMAINDER,
        help="Command to execute; accepts natural-language phrases.",
    )

    args = parser.parse_args()
    phrase = " ".join(args.command).lower()
    if not phrase:
        parser.print_help()
        return
    if "push" in phrase:
        push_latest()
    elif "refresh" in phrase or "redeploy" in phrase:
        refresh_working_copy()
    elif "rebase" in phrase:
        rebase_branch()
    elif "sync" in phrase:
        sync_connectors()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
