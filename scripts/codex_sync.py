#!/usr/bin/env python3
"""Codex Sync & Deploy tool for BlackRoad.io.

This script scaffolds the end-to-end pipeline linking GitHub, connectors,
Working Copy on iOS, and the production droplet.  Each function contains
placeholder logic that should be extended with project-specific
integration steps (e.g., OAuth flows, webhook handlers, or SSH commands).
"""

import argparse
import logging
import subprocess
from typing import List

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s"
)


def run(cmd: List[str]) -> None:
    """Run a command and log its invocation.

    The command's exit status is not enforced so that the scaffold can be
    adapted without failing when underlying systems are unreachable.
    """

    logging.info("Running: %s", " ".join(cmd))
    subprocess.run(cmd, check=False)


def push_latest() -> None:
    """Commit local changes and push to GitHub.

    Downstream systems (connectors, droplet) should watch for new commits
    and perform their own sync and deploy routines.
    """

    run(["git", "add", "-A"])
    run(["git", "commit", "-m", "chore: sync changes", "--allow-empty"])
    run(["git", "push"])
    logging.info("Placeholder: trigger downstream syncs after push")


def refresh_working_copy() -> None:
    """Refresh the local working copy (iOS) from GitHub."""

    logging.info("Placeholder: refresh Working Copy application")
    run(["git", "pull", "--rebase"])


def rebase_branch(branch: str) -> None:
    """Rebase the current branch onto the given branch."""

    run(["git", "fetch", "origin", branch])
    run(["git", "rebase", f"origin/{branch}"])
    logging.info("Placeholder: update site after rebase")


def sync_connectors() -> None:
    """Sync external connectors like Salesforce, Airtable, and Slack."""

    logging.info(
        "Placeholder: initiate OAuth flows and data sync between Salesforce, Airtable, and the droplet"
    )


def deploy() -> None:
    """Deploy the latest code to the droplet."""

    logging.info(
        "Placeholder: pull latest code, run migrations, and restart services on the droplet"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="BlackRoad.io Codex sync and deploy tool"
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("push", help="Push latest changes to GitHub")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    rebase_parser = sub.add_parser("rebase", help="Rebase branch and update site")
    rebase_parser.add_argument("--branch", default="main")
    sub.add_parser("sync-connectors", help="Sync Salesforce → Airtable → Droplet")
    sub.add_parser("deploy", help="Deploy latest build to droplet")

    args = parser.parse_args()

    if args.command == "push":
        push_latest()
    elif args.command == "refresh":
        refresh_working_copy()
        deploy()
    elif args.command == "rebase":
        rebase_branch(args.branch)
        deploy()
    elif args.command == "sync-connectors":
        sync_connectors()
    elif args.command == "deploy":
        deploy()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
