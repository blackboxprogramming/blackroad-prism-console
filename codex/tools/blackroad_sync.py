#!/usr/bin/env python3
"""Scaffold for BlackRoad.io end-to-end sync and deployment.

This script provides a chat-first control surface for triggering the
full pipeline from Codex to the live BlackRoad.io site. The current
implementation is a skeleton; connector integration and droplet deploy
steps are placeholders to be filled in later.
"""

import argparse
import subprocess
import logging
from typing import List

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def run(cmd: List[str]) -> None:
    """Run a shell command and log it."""
    logging.info("Running: %s", " ".join(cmd))
    subprocess.run(cmd, check=False)


def push_latest() -> None:
    """Commit and push local changes to GitHub."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", "chore: automatic commit from codex"])
    run(["git", "push"])


def sync_connectors() -> None:
    """Placeholder for connector sync (Salesforce, Airtable, Slack, etc.)."""
    logging.info("TODO: implement connector synchronization")


def refresh_working_copy() -> None:
    """Placeholder for iOS Working Copy refresh."""
    logging.info("TODO: implement Working Copy automation")


def deploy_to_droplet() -> None:
    """Placeholder for droplet deployment."""
    logging.info("TODO: implement droplet deployment")


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io sync scaffold")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("push", help="Commit and push local changes")
    sub.add_parser("sync", help="Sync connectors and Working Copy")
    sub.add_parser("deploy", help="Deploy latest code to droplet")
    sub.add_parser("all", help="Run push, sync, and deploy steps")

    args = parser.parse_args()

    if args.cmd == "push":
        push_latest()
    elif args.cmd == "sync":
        sync_connectors()
        refresh_working_copy()
    elif args.cmd == "deploy":
        deploy_to_droplet()
    elif args.cmd == "all":
        push_latest()
        sync_connectors()
        refresh_working_copy()
        deploy_to_droplet()
    else:
        parser.print_help()
"""BlackRoad end-to-end sync & deploy scaffolder.

This utility sketches the flow from local changes to the live site.  Each
step is represented by a function that can be filled in with project specific
logic.  The goal is to provide a single entry point that mirrors the
requirements in the "CodeX prompt" so an operator can type a natural language
command and have the underlying steps executed in order.

The functions are intentionally lightweight: they log what they would do and
return.  Replace the placeholders with real API calls, OAuth flows, webhook
handlers and deployment logic as the infrastructure solidifies.

Example usage::

    python codex/tools/blackroad_sync.py "Push latest to BlackRoad.io"

Available commands are documented in ``COMMAND_MAP`` below.
"""

from __future__ import annotations

import argparse
import shlex
import subprocess
from pathlib import Path
from typing import Callable, Dict


def run(cmd: str) -> None:
    """Run a shell command, streaming output to the console."""

    print(f"$ {cmd}")
    subprocess.run(shlex.split(cmd), check=False)


# --- GitHub integration ----------------------------------------------------


def github_push() -> None:
    """Commit and push local changes to the current branch."""

    run("git add -A")
    run("git commit -m 'chore: sync from codex' || true")
    run("git push origin HEAD")


# --- Connector placeholders -------------------------------------------------


def sync_connectors() -> None:
    """Stub for Salesforce/Airtable/Slack/Linear sync tasks."""

    print("[connectors] syncing external services… (placeholder)")


# --- Working Copy (iOS) ----------------------------------------------------


def refresh_working_copy() -> None:
    """Placeholder for automating iOS Working Copy refresh."""

    print("[working-copy] refresh triggered… (placeholder)")


# --- Droplet deployment ----------------------------------------------------

DEPLOY_PATH = Path("/srv/blackroad-api")


def deploy_to_droplet() -> None:
    """Pull latest code, run migrations and restart services."""

    print("[droplet] pulling latest code… (placeholder)")
    print("[droplet] running migrations… (placeholder)")
    print("[droplet] restarting services… (placeholder)")


# --- High level flows ------------------------------------------------------


def push_latest_flow() -> None:
    github_push()
    sync_connectors()
    refresh_working_copy()
    deploy_to_droplet()


def refresh_and_deploy_flow() -> None:
    refresh_working_copy()
    deploy_to_droplet()


def rebase_and_update_flow() -> None:
    run("git pull --rebase")
    deploy_to_droplet()


def sync_salesforce_to_droplet_flow() -> None:
    sync_connectors()
    deploy_to_droplet()


COMMAND_MAP: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": push_latest_flow,
    "refresh working copy and redeploy": refresh_and_deploy_flow,
    "rebase branch and update site": rebase_and_update_flow,
    "sync salesforce → airtable → droplet": sync_salesforce_to_droplet_flow,
    # allow ASCII arrow as well
    "sync salesforce -> airtable -> droplet": sync_salesforce_to_droplet_flow,
}


# --- CLI -------------------------------------------------------------------


def handle_command(text: str) -> None:
    key = text.lower().strip()
    fn = COMMAND_MAP.get(key)
    if not fn:
        print(f"Unknown command: {text}")
        return
    fn()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("command", nargs="+", help="chat-style instruction")
    args = ap.parse_args()
    handle_command(" ".join(args.command))


if __name__ == "__main__":
    main()
