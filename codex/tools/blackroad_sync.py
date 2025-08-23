#!/usr/bin/env python3
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
