#!/usr/bin/env python3
"""Scaffolded CI/CD orchestrator for BlackRoad.io.

This script provides a chat-like interface for pushing code, syncing
connectors, refreshing Working Copy, and deploying to the droplet. The
implementation is intentionally minimal and serves as a starting point for the
full automation pipeline described in the project brief.
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
from dataclasses import dataclass

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


# --------------------------- helpers ---------------------------


def run(cmd: str) -> None:
    """Run a shell command with logging."""
    logging.info("Running: %s", cmd)
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        raise subprocess.CalledProcessError(result.returncode, cmd)


# --------------------------- git operations ---------------------------


def push_latest() -> None:
    """Commit local changes and push to the remote repository."""
    run("git add -A")
    run('git commit -m "Auto-commit from Codex" || echo "No changes to commit"')
    run("git pull --rebase")
    run("git push")


def rebase_branch() -> None:
    """Rebase the current branch on the remote."""
    run("git pull --rebase")


# --------------------------- connectors ---------------------------


@dataclass
class Connector:
    token: str | None

    def sync(self) -> None:  # pragma: no cover - placeholder
        raise NotImplementedError


class SalesforceConnector(Connector):
    def sync(self) -> None:  # pragma: no cover - placeholder
        logging.info("Syncing Salesforce metadata (placeholder)")


class AirtableConnector(Connector):
    def sync(self) -> None:  # pragma: no cover - placeholder
        logging.info("Syncing Airtable data (placeholder)")


class LinearConnector(Connector):
    def sync(self) -> None:  # pragma: no cover - placeholder
        logging.info("Syncing Linear tickets (placeholder)")


class SlackConnector(Connector):
    def notify(self, message: str) -> None:
        """Post ``message`` to a Slack incoming webhook.

        The ``token`` attribute is treated as the webhook URL.  If it is not
        configured the notification is skipped gracefully.
        """
        if not self.token:
            logging.info("Slack webhook not configured; skipping notification")
            return
        try:
            resp = requests.post(self.token, json={"text": message}, timeout=10)
            resp.raise_for_status()
        except Exception as exc:  # pragma: no cover - network
            logging.warning("Slack notification failed: %s", exc)


def sync_connectors() -> None:
    """Synchronise external connectors."""
    sf = SalesforceConnector(token=os.getenv("SALESFORCE_TOKEN"))
    at = AirtableConnector(token=os.getenv("AIRTABLE_TOKEN"))
    ln = LinearConnector(token=os.getenv("LINEAR_TOKEN"))
    slack = SlackConnector(token=os.getenv("SLACK_WEBHOOK_URL"))

    for conn in (sf, at, ln):
        conn.sync()

    slack.notify("Connector sync complete")


# --------------------------- deployment ---------------------------


def refresh_working_copy() -> None:  # pragma: no cover - placeholder
    logging.info("Refreshing Working Copy (placeholder)")


def deploy_to_droplet() -> None:  # pragma: no cover - placeholder
    logging.info("Deploying to droplet (placeholder)")


# --------------------------- command dispatcher ---------------------------


def handle_command(command: str) -> None:
    cmd = command.lower()
    if "push" in cmd:
        push_latest()
        deploy_to_droplet()
    elif "refresh" in cmd and "redeploy" in cmd:
        refresh_working_copy()
        deploy_to_droplet()
    elif "rebase" in cmd:
        rebase_branch()
        deploy_to_droplet()
    elif "sync" in cmd:
        sync_connectors()
        deploy_to_droplet()
    else:
        logging.warning("Unrecognised command: %s", command)


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad CI/CD orchestrator")
    parser.add_argument("command", nargs="+", help="Natural language command")
    args = parser.parse_args()
    handle_command(" ".join(args.command))


if __name__ == "__main__":
    main()
