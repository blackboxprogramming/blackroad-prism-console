#!/usr/bin/env python3
"""Unified Codex pipeline controller for BlackRoad.

This lightweight scaffold offers a chat-first control surface that maps
high level operator phrases to underlying Git/GitHub, connector, working
copy and droplet deployment actions. Actual integrations with services
such as Salesforce, Airtable or Slack are represented as placeholders so
this script can run in restricted environments while still showing the
expected control flow.

Example usage::

    python scripts/blackroad_pipeline.py "Push latest to BlackRoad.io"
    python scripts/blackroad_pipeline.py "Refresh working copy and redeploy"

"""
from __future__ import annotations

import argparse
import subprocess
from typing import Callable, Dict


def run(cmd: list[str]) -> None:
    """Run a command, printing it first.

    The subprocess call is wrapped so this script can be easily adapted to
    real environments. Failed commands will raise an exception which callers
    can catch for retry logic.
    """
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


# ---------- pipeline step placeholders ----------


def sync_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    print("syncing connectors ... (placeholder)")


def refresh_working_copy() -> None:
    """Placeholder for Working Copy automation."""
    print("refreshing working copy ... (placeholder)")


def deploy_droplet() -> None:
    """Placeholder for droplet deployment logic."""
    print("deploying to droplet ... (placeholder)")


def push_latest() -> None:
    """Push local commits and trigger full pipeline."""
    run(["git", "push"])
    sync_connectors()
    refresh_working_copy()
    deploy_droplet()


def refresh_and_redeploy() -> None:
    """Refresh working copy and redeploy droplet."""
    refresh_working_copy()
    deploy_droplet()


def rebase_and_update() -> None:
    """Rebase with upstream before running the full pipeline."""
    run(["git", "pull", "--rebase"])
    push_latest()


def sync_connectors_only() -> None:
    """Run connector sync without touching code."""
    sync_connectors()


COMMANDS: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": push_latest,
    "refresh working copy and redeploy": refresh_and_redeploy,
    "rebase branch and update site": rebase_and_update,
    "sync salesforce -> airtable -> droplet": sync_connectors_only,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Codex pipeline controller")
    parser.add_argument("phrase", help="operator phrase describing the action")
    args = parser.parse_args()

    phrase = args.phrase.strip().lower()
    action = COMMANDS.get(phrase)
    if not action:
        print("Unrecognised phrase. Supported commands:")
        for key in COMMANDS:
            print("  -", key)
        raise SystemExit(1)
    action()


if __name__ == "__main__":
    main()
