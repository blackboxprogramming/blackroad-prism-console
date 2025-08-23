#!/usr/bin/env python3
"""BlackRoad Sync Pipeline

Scaffolds an end-to-end flow from the local repo to the live BlackRoad.io
instance.  Provides a small CLI that mirrors the chat-first commands described
in the spec.  Each sub-command only logs the intended action so the script can
be extended into a full CI/CD pipeline.

Usage:
  python codex/tools/blackroad_sync.py push     # push latest to GitHub
  python codex/tools/blackroad_sync.py refresh  # refresh working copy & redeploy
  python codex/tools/blackroad_sync.py rebase   # rebase branch and update site
  python codex/tools/blackroad_sync.py sync     # sync external connectors
"""

from __future__ import annotations

import argparse
import subprocess


def run(cmd: list[str]) -> str:
    """Run a shell command and return stdout.

    The helper is intentionally lightweight so it can be reused when the
    placeholder actions are replaced with real logic (e.g., hitting webhooks,
    posting to Slack, etc.).
    """

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"{cmd} failed: {proc.stderr.strip()}")
    return proc.stdout.strip()


def push_latest() -> None:
    """Push current branch to GitHub and trigger downstream syncs."""

    print("Pushing changes to GitHub…")
    try:
        run(["git", "push", "origin", "HEAD"])
        print("✔ Pushed to GitHub")
    except Exception as exc:  # pragma: no cover - placeholder
        print(f"Push failed: {exc}")

    # Placeholders for real integrations
    print("Triggering connector sync (Salesforce/Airtable/Slack/Linear)…")
    print("Notifying droplet to pull and deploy…")


def refresh_working_copy() -> None:
    """Refresh local working copy and redeploy services."""

    print("Refreshing working copy…")
    try:
        run(["git", "pull", "--rebase"])
        print("✔ Working copy up to date")
    except Exception as exc:  # pragma: no cover - placeholder
        print(f"Refresh failed: {exc}")

    print("Restarting droplet services (API, LLM, Nginx)…")


def rebase_branch() -> None:
    """Rebase the current branch onto main and push."""

    print("Rebasing onto origin/main…")
    try:
        run(["git", "fetch", "origin", "main"])
        run(["git", "rebase", "origin/main"])
        run(["git", "push", "--force-with-lease"])
        print("✔ Rebased and pushed")
    except Exception as exc:  # pragma: no cover - placeholder
        print(f"Rebase failed: {exc}")


def sync_connectors() -> None:
    """Sync external systems (placeholder)."""

    print("Syncing Salesforce → Airtable → Droplet…")
    print("Posting status to Slack…")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="BlackRoad.io end-to-end sync")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("push", help="Push latest changes to GitHub and deploy")
    sub.add_parser(
        "refresh", help="Refresh working copy, run migrations, restart services"
    )
    sub.add_parser("rebase", help="Rebase current branch onto main and push")
    sub.add_parser("sync", help="Sync external connectors")

    args = parser.parse_args(argv)
    if args.cmd == "push":
        push_latest()
    elif args.cmd == "refresh":
        refresh_working_copy()
    elif args.cmd == "rebase":
        rebase_branch()
    elif args.cmd == "sync":
        sync_connectors()
    else:
        parser.print_help()
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    raise SystemExit(main())

