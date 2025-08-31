#!/usr/bin/env python3
"""Unified Codex orchestration for BlackRoad.io.

This script offers a chat-style control surface to coordinate
Git operations, connector jobs, working-copy sync, and droplet deploys.

Example usage:
    python scripts/blackroad_codex.py "Push latest to BlackRoad.io"
"""
from __future__ import annotations

import argparse
import logging
import os
import shlex
import subprocess
from typing import Callable, Dict


def run(cmd: str) -> None:
    """Run a shell command, raising on failure."""
    logging.info("$ %s", cmd)
    subprocess.run(shlex.split(cmd), check=True)


def push_latest() -> None:
    """Commit all changes and push, then deploy to the droplet."""
    run("git add -A")
    run("git commit -m 'codex: auto-commit' || true")
    run("git push")
    host = os.environ.get("DROPLET_HOST")
    if host:
        run(f"ssh {host} 'bash -s' < scripts/deploy.sh")
    else:
        logging.warning("DROPLET_HOST not set; skipping remote deploy")


def refresh_and_redeploy() -> None:
    """Refresh working copy and redeploy services."""
    run("git pull --rebase")
    push_latest()


def rebase_update() -> None:
    """Rebase current branch on origin/main and push."""
    run("git fetch origin")
    run("git rebase origin/main")
    push_latest()


def sync_connectors() -> None:
    """Sync Salesforce -> Airtable -> Droplet (stub)."""
    # Placeholder for OAuth flows and data jobs.
    logging.info("Connector sync not implemented yet")


COMMAND_MAP: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": push_latest,
    "refresh working copy and redeploy": refresh_and_redeploy,
    "rebase branch and update site": rebase_update,
    "sync salesforce -> airtable -> droplet": sync_connectors,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad Codex controller")
    parser.add_argument("command", help="Chat-style command to execute")
    args = parser.parse_args()
    key = args.command.strip().lower()
    func = COMMAND_MAP.get(key)
    if not func:
        raise SystemExit(f"Unknown command: {args.command}")
    func()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")
    main()
