#!/usr/bin/env python3
"""Unified BlackRoad.io sync & deploy helper.

This script provides a chat-friendly command line interface that glues
GitHub, connectors, working copies and droplet deployment into a single
flow.  The heavy lifting (OAuth handshakes, remote jobs, etc.) is left as
future work, but the plumbing is in place so that Codex or other agents
can trigger each step with a simple command.
"""
from __future__ import annotations

import argparse
import logging
import subprocess
import sys
from typing import Sequence


def run(cmd: Sequence[str]) -> None:
    """Run *cmd* and exit on failure."""
    logging.info("$ %s", " ".join(cmd))
    result = subprocess.run(cmd)
    if result.returncode != 0:
        logging.error("command failed: %s", cmd)
        sys.exit(result.returncode)


def push_latest(args: argparse.Namespace) -> None:
    """Commit local changes and push to GitHub."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", args.message])
    run(["git", "pull", "--rebase"])
    run(["git", "push"])
    # TODO: trigger connector sync jobs
    # TODO: trigger droplet deployment and slack notifications


def refresh(args: argparse.Namespace) -> None:
    """Refresh the working copy and redeploy the site."""
    run(["git", "pull", "--rebase"])
    # TODO: run migration scripts and service restarts


def rebase(args: argparse.Namespace) -> None:
    """Rebase current branch on top of main and push."""
    run(["git", "fetch", "origin"])
    run(["git", "rebase", "origin/main"])
    run(["git", "push", "--force-with-lease"])
    # TODO: trigger deployment if needed


def sync_connectors(args: argparse.Namespace) -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    # TODO: implement OAuth flows and background jobs
    logging.info("connector sync stub")


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io sync helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_push = sub.add_parser("push", help="Commit and push latest changes")
    p_push.add_argument("-m", "--message", default="chore: sync via codex")
    p_push.set_defaults(func=push_latest)

    p_refresh = sub.add_parser("refresh", help="Refresh working copy and redeploy")
    p_refresh.set_defaults(func=refresh)

    p_rebase = sub.add_parser("rebase", help="Rebase branch on main and push")
    p_rebase.set_defaults(func=rebase)

    p_sync = sub.add_parser("sync-connectors", help="Sync external systems")
    p_sync.set_defaults(func=sync_connectors)

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    args.func(args)


if __name__ == "__main__":
    main()
