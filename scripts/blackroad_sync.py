#!/usr/bin/env python3
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
