#!/usr/bin/env python3
"""
BlackRoad sync/deploy scaffolding.

This module provides a high-level entrypoint that describes the steps needed
for a full end-to-end sync from Codex to the live BlackRoad.io deployment.
Actual connector, Working Copy, and Droplet implementations are intentionally
left as placeholders; they can be expanded as infrastructure is built out.
"""

from __future__ import annotations

import argparse
import logging
import subprocess
from pathlib import Path
from typing import Sequence

log = logging.getLogger(__name__)


def run(cmd: Sequence[str], cwd: Path | None = None) -> None:
    """Run a command, raising if it fails."""
    log.debug("Running %s", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=cwd)


def git_push() -> None:
    """Push local commits to the configured Git remote."""
    run(["git", "push"])


def refresh_working_copy() -> None:
    """Placeholder for refreshing the Working Copy iOS app."""
    log.info("Refreshing Working Copy (placeholder)")


def deploy_droplet() -> None:
    """Placeholder for pulling and deploying on the droplet."""
    log.info("Deploying to droplet (placeholder)")


def sync_connectors() -> None:
    """Placeholder for syncing Salesforce/Airtable/Slack/Linear."""
    log.info("Syncing connectors (placeholder)")


ACTIONS = {
    "push": git_push,
    "refresh": refresh_working_copy,
    "deploy": deploy_droplet,
    "sync": sync_connectors,
}


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="BlackRoad sync/deploy helper")
    parser.add_argument("action", choices=sorted(ACTIONS), help="operation to run")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO)
    ACTIONS[args.action]()


if __name__ == "__main__":
    main()

