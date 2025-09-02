#!/usr/bin/env python3
"""Unified BlackRoad.io deployment pipeline scaffold.

This lightweight script provides a chat-first control surface for syncing
changes from a local Codex environment all the way to the live BlackRoad.io
site.  Each step is represented by a function that currently performs minimal
behaviour (usually logging), acting as placeholders for future integrations.

Usage examples::

    # Push local commits and deploy
    python scripts/sync_pipeline.py "Push latest to BlackRoad.io"

    # Refresh working copy and redeploy
    python scripts/sync_pipeline.py "Refresh working copy and redeploy"

The goal is to standardise how agents interact with the CI/CD pipeline.  The
real implementation should replace the placeholders with integrations for
GitHub, connectors (Salesforce, Airtable, Slack, Linear, etc.), Working Copy
clients and droplet deployments.
"""

from __future__ import annotations

import argparse
import subprocess
from typing import Callable, Dict

# --------------------------- helpers ---------------------------


def run(cmd: list[str]) -> int:
    """Run *cmd* and return the exit code.

    The real pipeline will likely require more sophisticated error handling,
    retries and logging.  For now we simply surface the command execution and
    return the exit status.
    """

    print("$", " ".join(cmd))
    completed = subprocess.run(cmd, check=False)
    return completed.returncode


# --------------------------- pipeline steps ---------------------------


def push_latest(message: str = "chore: sync") -> None:
    """Commit and push local changes to GitHub."""

    run(["git", "add", "-A"])
    run(["git", "commit", "-m", message])
    run(["git", "pull", "--rebase"])
    run(["git", "push"])


def sync_connectors() -> None:
    """Placeholder for syncing third-party connectors."""

    print("[connectors] sync not yet implemented")


def refresh_working_copy() -> None:
    """Placeholder for refreshing Working Copy on iOS."""

    print("[working-copy] refresh not yet implemented")


def deploy_droplet() -> None:
    """Placeholder for pulling and deploying on the droplet."""

    print("[droplet] deploy not yet implemented")


# --------------------------- command dispatch ---------------------------


CommandFunc = Callable[[], None]


def handle_push() -> None:
    push_latest()
    sync_connectors()
    refresh_working_copy()
    deploy_droplet()


def handle_refresh() -> None:
    refresh_working_copy()
    deploy_droplet()


def handle_rebase() -> None:
    run(["git", "pull", "--rebase"])
    deploy_droplet()


def handle_sync_chain() -> None:
    sync_connectors()
    deploy_droplet()


COMMANDS: Dict[str, CommandFunc] = {
    "push latest to blackroad.io": handle_push,
    "refresh working copy and redeploy": handle_refresh,
    "rebase branch and update site": handle_rebase,
    "sync salesforce → airtable → droplet": handle_sync_chain,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="BlackRoad deployment control surface")
    parser.add_argument("command", help="Natural language command to execute")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    command = args.command.strip().lower()
    func = COMMANDS.get(command)
    if not func:
        available = ", ".join(COMMANDS.keys())
        print(f"Unknown command: {command}\nAvailable: {available}")
        return 1
    func()
    return 0


if __name__ == "__main__":  # pragma: no cover - script entrypoint
    raise SystemExit(main())
