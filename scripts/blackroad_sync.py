#!/usr/bin/env python3
"""BlackRoad.io sync and deploy helper.

Provides a simple chat-like interface for the Codex pipeline.
"""Unified pipeline for syncing code and deployments to BlackRoad.io.

This script provides a chat-style interface to trigger operations like
pushing latest code, refreshing working copies and redeploying services.
It stitches together the high level flow:

Codex -> GitHub -> Connectors -> Working Copy -> Droplet -> BlackRoad.io

The functions mostly serve as placeholders; real integrations should be
implemented using the appropriate APIs and credentials.
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
import logging
import subprocess
from typing import Callable, Dict


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


def run(cmd: str) -> None:
    """Run a shell command and log the result."""
    logging.info("$ %s", cmd)
    try:
        subprocess.run(cmd, shell=True, check=True)
    except subprocess.CalledProcessError as err:
        logging.error("command failed: %s", err)
        raise


# --- Pipeline steps -------------------------------------------------------


def github_push() -> None:
    """Push committed changes to GitHub and trigger downstream syncs."""
    run("git push")
    logging.info("GitHub push complete.")


def connectors_sync() -> None:
    """Placeholder for syncing external connectors (Salesforce, Airtable, etc.)."""
    logging.info("Syncing connectors ... (placeholder)")


def working_copy_refresh() -> None:
    """Refresh the Working Copy app on iOS."""
    logging.info("Refreshing Working Copy ... (placeholder)")


def droplet_deploy() -> None:
    """Pull, migrate and restart services on the droplet."""
    logging.info("Deploying to droplet ... (placeholder)")


# --- Chat command surface ------------------------------------------------

COMMANDS: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": lambda: (github_push(), droplet_deploy()),
    "refresh working copy and redeploy": lambda: (
        working_copy_refresh(),
        droplet_deploy(),
    ),
    "rebase branch and update site": lambda: (
        run("git pull --rebase"),
        github_push(),
        droplet_deploy(),
    ),
    "sync salesforce -> airtable -> droplet": lambda: (
        connectors_sync(),
        droplet_deploy(),
    ),
}


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io pipeline runner")
    parser.add_argument("command", help="Command phrase to execute")
    args = parser.parse_args()
    cmd = args.command.lower()
    func = COMMANDS.get(cmd)
    if not func:
        logging.error("Unknown command: %s", cmd)
        return
    func()
    logging.info("%s -- done", cmd)


if __name__ == "__main__":
    main()
