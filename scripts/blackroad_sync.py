#!/usr/bin/env python3
"""Utility for syncing BlackRoad.io environments.

This script is a scaffold for automating the end-to-end flow:
GitHub -> connectors -> working copy -> droplet -> live site.
It exposes high level commands that can be triggered from a
chat interface or run directly from the command line.

The implementation here focuses on local git interactions and provides
placeholders for remote operations and connector synchronization.
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
from typing import Sequence

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def run(cmd: Sequence[str]) -> None:
    """Run a command and stream its output.

    Args:
        cmd: Command and arguments to execute.
    """
    logging.debug("Running command: %s", " ".join(cmd))
    subprocess.run(cmd, check=True)


def push_latest() -> None:
    """Push the current branch to GitHub."""
    run(["git", "push"])


def refresh_working_copy() -> None:
    """Pull latest changes and redeploy."""
    run(["git", "pull", "--rebase", "origin", os.getenv("BRANCH", "main")])
    deploy()


def rebase_branch(branch: str) -> None:
    """Rebase the current branch onto the given branch and redeploy."""
    run(["git", "fetch", "origin", branch])
    run(["git", "rebase", f"origin/{branch}"])
    deploy()


def sync_connectors() -> None:
    """Synchronize external systems.

    This function is a placeholder for Salesforce, Airtable, Slack,
    Linear and other connector jobs.
    """
    logging.info("Connector synchronization not yet implemented.")


def deploy() -> None:
    """Deploy code to the droplet.

    This placeholder demonstrates where deployment logic would live. In
    practice this might SSH to a remote host, pull the latest code,
    run migrations and restart services.
    """
    logging.info("Deployment step not yet implemented.")


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io sync utility")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("push", help="Push current branch to GitHub")
    sub.add_parser("refresh", help="Pull latest and redeploy")

    rebase = sub.add_parser("rebase", help="Rebase onto main and redeploy")
    rebase.add_argument("--branch", default="main", help="Branch to rebase onto")

    sub.add_parser("sync", help="Run external connector jobs")

    args = parser.parse_args()

    if args.command == "push":
        push_latest()
    elif args.command == "refresh":
        refresh_working_copy()
    elif args.command == "rebase":
        rebase_branch(args.branch)
    elif args.command == "sync":
        sync_connectors()


if __name__ == "__main__":
    main()
