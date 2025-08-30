"""Codex pipeline skeleton for BlackRoad.io deployment.

This script orchestrates flows from local changes to live site, through GitHub,
connectors (Salesforce/Airtable/Slack/Linear), working copy, droplet and website.
It also supports chat commands for push/refresh operations.
"""

import logging
import subprocess
import json
import urllib.request
from typing import List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def log_backend(level: str, message: str) -> None:
    """Send a log entry to the backend monitoring API."""
    try:
        data = json.dumps({"service": "pipeline", "level": level, "message": message}).encode()
        req = urllib.request.Request(
            "http://127.0.0.1:4000/api/logs",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception as e:  # noqa: BLE001
        logging.warning("Failed to send log to backend: %s", e)


def run(cmd: List[str]) -> subprocess.CompletedProcess:
    """Run a shell command, capture output and raise on failure."""
    logging.info("Running command: %s", " ".join(cmd))
    try:
        return subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        log_backend("error", f"Command failed: {' '.join(cmd)}: {e.stderr.strip()}")
        raise


def validate() -> None:
    """Placeholder validation step."""
    try:
        logging.info("Validating repository state...")
        # insert validation logic here
    except Exception as e:  # noqa: BLE001
        log_backend("error", f"Validation error: {e}")
        raise


def rollback() -> None:
    """Placeholder rollback step."""
    try:
        logging.info("Running rollback...")
        # insert rollback logic here
    except Exception as e:  # noqa: BLE001
        log_backend("error", f"Rollback error: {e}")
        raise


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
    try:
        validate()
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
    except Exception as e:  # noqa: BLE001
        log_backend("error", f"Pipeline failure: {e}")
        try:
            rollback()
        except Exception as rb:  # noqa: BLE001
            log_backend("error", f"Rollback failure: {rb}")
        raise


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
