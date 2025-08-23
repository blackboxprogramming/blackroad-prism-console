#!/usr/bin/env python3
"""Unified CI/CD helper for BlackRoad.io.

This script offers a chat-friendly interface so operators can push,
rebase and redeploy the BlackRoad stack from one entry point. External
services such as Salesforce, Airtable, Slack and deployment droplets are
represented as placeholders so the script runs in constrained
environments. Integrators can hook the stubs into real systems using
OAuth tokens or webhooks.
"""
from __future__ import annotations

import argparse
import os
import subprocess


# --------------------------- helpers ---------------------------

def run(cmd: list[str]) -> None:
    """Run a subprocess command, echoing it to stdout."""
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def git_commit_push(message: str) -> None:
    """Commit all changes and push to the current branch."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", message])
    run(["git", "pull", "--rebase"])
    run(["git", "push"])


# --------------------------- core actions ---------------------------


def deploy_droplet() -> None:
    """Trigger deployment on the remote droplet via SSH.

    The target host can be provided via the ``BLACKROAD_DROPLET``
    environment variable. The droplet is expected to expose a
    ``deploy_blackroad`` command that performs a pull, migration and
    service restart. The function is a stub when no host is configured.
    """
    host = os.environ.get("BLACKROAD_DROPLET")
    if not host:
        print("No droplet configured; skipping deploy.")
        return
    run(["ssh", host, "deploy_blackroad"])


def sync_connectors() -> None:
    """Placeholder sync for Salesforce, Airtable, Slack and Linear."""
    print("Syncing external connectors ... (stub)")
    # Integrators can place their connector logic here, e.g. making
    # HTTP requests with OAuth tokens or invoking background jobs.


def refresh_working_copy() -> None:
    """Ensure local working copy matches GitHub and droplet."""
    run(["git", "pull", "--rebase"])
    deploy_droplet()


def cmd_push(args: argparse.Namespace) -> None:  # noqa: D401 - short alias
    """Handle the ``push`` command."""
    git_commit_push(args.message)
    sync_connectors()
    deploy_droplet()


def cmd_refresh(_args: argparse.Namespace) -> None:
    """Force a refresh of working copy and redeploy droplet."""
    refresh_working_copy()


def cmd_rebase(_args: argparse.Namespace) -> None:
    """Rebase current branch onto ``origin/main`` and push."""
    run(["git", "fetch", "origin"])
    run(["git", "rebase", "origin/main"])
    run(["git", "push", "-f"])
    sync_connectors()
    deploy_droplet()


def cmd_sync(_args: argparse.Namespace) -> None:  # noqa: D401 - short alias
    """Run connector sync jobs without touching git."""
    sync_connectors()


# --------------------------- CLI ---------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="BlackRoad.io CI/CD helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_push = sub.add_parser("push", help="Commit, push and deploy")
    p_push.add_argument("-m", "--message", default="chore: update via codex")
    p_push.set_defaults(func=cmd_push)

    p_refresh = sub.add_parser(
        "refresh", help="Pull latest changes and redeploy droplet"
    )
    p_refresh.set_defaults(func=cmd_refresh)

    p_rebase = sub.add_parser(
        "rebase", help="Rebase current branch onto origin/main and deploy"
    )
    p_rebase.set_defaults(func=cmd_rebase)

    p_sync = sub.add_parser("sync", help="Sync external connectors only")
    p_sync.set_defaults(func=cmd_sync)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
