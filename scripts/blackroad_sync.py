#!/usr/bin/env python3
"""Chat-first sync and deploy scaffold for BlackRoad.io.

This script provides a minimal command surface that translates natural
language requests into git and deployment operations. It is intended as a
starting point for the full Codex pipeline described in project docs.
Actual connector integrations and remote deployments must be wired in by
operators.
"""
from __future__ import annotations

import argparse
import subprocess
import sys


# --------------------------- helpers ---------------------------

def run(cmd: str) -> None:
    """Run shell command and stream output."""
    print(f"-> {cmd}")
    try:
        subprocess.run(cmd, shell=True, check=True)
    except subprocess.CalledProcessError as exc:  # noqa: BLE001
        print(f"command failed: {exc}")
        sys.exit(exc.returncode)


# --------------------------- actions ---------------------------

def push_latest() -> None:
    """Commit local changes, rebase and push to origin."""
    run("git add -A")
    # commit may fail if nothing to commit; swallow error
    subprocess.run(
        'git commit -m "Sync from Codex" || echo "nothing to commit"',
        shell=True,
        check=False,
    )
    run("git pull --rebase")
    run("git push")
    print("triggered connectors and deployment hooks (placeholder)")


def refresh_working_copy() -> None:
    """Pull latest changes and redeploy site."""
    run("git pull")
    print("refreshed working copy and redeployed site (placeholder)")


def rebase_branch() -> None:
    """Rebase current branch on origin/main and push."""
    run("git fetch origin")
    run("git rebase origin/main")
    run("git push --force-with-lease")
    print("rebased branch and updated site (placeholder)")


def sync_salesforce_airtable_droplet() -> None:
    """Demonstrate connector sync flow."""
    print("syncing Salesforce → Airtable → Droplet (placeholder)")


COMMANDS = {
    "push latest": push_latest,
    "refresh working copy": refresh_working_copy,
    "rebase branch": rebase_branch,
    "sync salesforce": sync_salesforce_airtable_droplet,
}


# --------------------------- main interface ---------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="BlackRoad Codex sync utility",
        epilog="example: python scripts/blackroad_sync.py \"Push latest to BlackRoad.io\"",
    )
    parser.add_argument("command", nargs="+", help="natural language command")
    args = parser.parse_args()
    text = " ".join(args.command).lower()
    for key, func in COMMANDS.items():
        if key in text:
            func()
            break
    else:
        print(f"unknown command: {text}")
        sys.exit(1)


if __name__ == "__main__":
    main()
