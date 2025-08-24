#!/usr/bin/env python3
"""
Codex Build Script for BlackRoad.io Sync & Deploy

This script provides a chat-friendly command-line interface to push
changes from Codex to GitHub and ensure the live BlackRoad.io site stays
current.  The implementation focuses on orchestration and leaves service
specifics (OAuth, webhooks, etc.) as placeholders to be filled in by
operators.

Supported commands:
  - push-latest            commit and push working tree, then deploy
  - refresh                pull latest and redeploy
  - rebase BRANCH          rebase local branch onto upstream and deploy
  - sync-connectors        example sync for Salesforce → Airtable → Droplet

Each step logs basic status messages so higher level Codex agents can
relay progress back to operators via chat.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()


# -------------------------
# Helpers
# -------------------------
def run(cmd: list[str] | str, cwd: Path | None = None) -> str:
    """Run a command and return stdout. Raises on failure."""
    if isinstance(cmd, str):
        cmd = cmd.split()
    proc = subprocess.run(cmd, cwd=cwd or ROOT, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd)} failed: {proc.stderr.strip()}")
    return proc.stdout.strip()


def git(*args: str) -> str:
    return run(["git", *args])


# -------------------------
# Core Actions (placeholders)
# -------------------------
def auto_commit_and_push(message: str, branch: str = "main") -> None:
    """Commit local changes and push to the given branch."""
    git("add", "-A")
    try:
        git("commit", "-m", message)
    except RuntimeError:
        # Nothing to commit
        pass
    git("pull", "--rebase", "origin", branch)
    git("push", "origin", branch)


def trigger_connectors() -> None:
    """Placeholder for kicking off Salesforce/Airtable/Slack jobs."""
    print("[connectors] would trigger OAuth-backed sync jobs here")


def refresh_working_copy() -> None:
    """Placeholder for Working Copy (iOS) automation hooks."""
    print("[working-copy] would run git pull/push via x-callback-url")


def deploy_to_droplet() -> None:
    """Placeholder for remote deployment on the Droplet server."""
    print("[droplet] would ssh and run git pull + migrations + restart")


def push_latest() -> None:
    auto_commit_and_push("chore: automated push from Codex")
    trigger_connectors()
    refresh_working_copy()
    deploy_to_droplet()


def refresh_and_deploy() -> None:
    git("pull", "--rebase")
    refresh_working_copy()
    deploy_to_droplet()


def rebase_branch(branch: str) -> None:
    git("fetch", "origin")
    git("rebase", f"origin/{branch}")
    auto_commit_and_push(f"chore: rebase onto {branch}", branch)
    deploy_to_droplet()


def sync_connectors() -> None:
    trigger_connectors()
    deploy_to_droplet()


# -------------------------
# CLI
# -------------------------
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Codex build helper")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("push-latest")
    sub.add_parser("refresh")

    rb = sub.add_parser("rebase")
    rb.add_argument("branch")

    sub.add_parser("sync-connectors")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.cmd == "push-latest":
            push_latest()
        elif args.cmd == "refresh":
            refresh_and_deploy()
        elif args.cmd == "rebase":
            rebase_branch(args.branch)
        elif args.cmd == "sync-connectors":
            sync_connectors()
    except Exception as e:
        print(f"✖ {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

