"""Codex pipeline skeleton for BlackRoad.io deployment.

This script orchestrates flows from local changes to live site, through GitHub,
connectors (Salesforce/Airtable/Slack/Linear), working copy, droplet and website.
It also supports chat commands for push/refresh operations.
"""

import logging
import subprocess
from typing import List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def run(cmd: List[str]) -> subprocess.CompletedProcess:
    """Run a shell command, capture output and raise on failure."""
    logging.info("Running command: %s", " ".join(cmd))
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


# GitHub integration
def sync_github(message: str = "Automated commit") -> None:
    """Commit and push repository changes to origin/main."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", message])
    run(["git", "push", "origin", "main"])


# Connectors
def sync_connectors() -> None:
    """Placeholder for connector sync jobs (Salesforce/Airtable/Slack/Linear)."""
    logging.info("Syncing connectors...")


# Working Copy
def sync_working_copy() -> None:
    """Placeholder for automation hooks to refresh iOS Working Copy."""
    logging.info("Syncing iOS Working Copy...")


# Droplet deployment
def deploy_droplet() -> None:
    """Pull code on the droplet, run migrations and restart services."""
    logging.info("Deploying to droplet...")


# Site refresh
def refresh_site() -> None:
    """Verify site refresh and check health endpoints."""
    logging.info("Refreshing BlackRoad.io...")


# Command dispatcher
def execute_command(command: str, commit_message: Optional[str] = None) -> None:
    """Dispatch chat command to pipeline steps."""
    command = command.lower().strip()
    if command == "push latest to blackroad.io":
        sync_github(commit_message or "Automated update")
        sync_connectors()
        sync_working_copy()
        deploy_droplet()
        refresh_site()
    elif command == "refresh working copy and redeploy":
        sync_working_copy()
        deploy_droplet()
        refresh_site()
    elif command == "rebase branch and update site":
        run(["git", "pull", "--rebase", "origin", "main"])
        sync_github(commit_message or "Rebased and deployed")
        deploy_droplet()
        refresh_site()
    elif command == "sync salesforce -> airtable -> droplet":
        sync_connectors()
        deploy_droplet()
    else:
        logging.warning("Unknown command: %s", command)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Codex pipeline skeleton")
    parser.add_argument("command", help="Command to execute", nargs="?")
    parser.add_argument("--message", help="Commit message")
    args = parser.parse_args()
    if args.command:
        execute_command(args.command, args.message)
    else:
        parser.print_help()
