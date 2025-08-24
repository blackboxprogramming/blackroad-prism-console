#!/usr/bin/env python3
"""Codex pipeline scaffold for BlackRoad.io.

This CLI provides placeholder commands that outline an end-to-end
synchronisation flow:

* Commit and push local code to GitHub.
* Refresh iOS Working Copy state.
* Redeploy the BlackRoad droplet.
* Trigger external connector jobs (Salesforce, Airtable, etc.).

Each step contains TODO markers where project-specific logic should be
implemented. The script is intended as a starting point for a full CI/CD
solution rather than a complete deployment utility.
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import webbrowser
from urllib import error, request

LOGGER = logging.getLogger(__name__)
_FILE_HANDLER = logging.FileHandler("pipeline.log")
_FILE_HANDLER.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
LOGGER.addHandler(_FILE_HANDLER)
LOGGER.setLevel(logging.INFO)


def run(cmd: str, *, dry_run: bool = False) -> None:
    """Run a shell command and stream output."""
    LOGGER.info("[cmd] %s", cmd)
    if dry_run:
        return
    subprocess.run(cmd, shell=True, check=True)


def push_latest(*, dry_run: bool = False) -> None:
    """Push local commits to GitHub."""
    # TODO: handle authentication, branching, conflict resolution, and
    # downstream webhook notifications.
    run("git push origin HEAD", dry_run=dry_run)


def refresh_working_copy(*, repo_path: str = ".", dry_run: bool = False) -> None:
    """Refresh the Working Copy mirror for this repository."""
    sync_to_working_copy(repo_path, dry_run=dry_run)


def sync_to_working_copy(repo_path: str, *, dry_run: bool = False) -> None:
    """Ensure the repo is up to date in the Working Copy app.

    The function checks for a ``working-copy`` remote, pushes to it and
    triggers a pull inside the iOS application.  On Linux this URL scheme is
    not executed but left as documentation for iOS automation.
    """

    LOGGER.info("sync_to_working_copy repo_path=%s", repo_path)
    try:
        result = subprocess.run(
            ["git", "-C", repo_path, "remote"],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as exc:  # pragma: no cover - defensive
        LOGGER.error("git remote failed: %s", exc)
        return

    if "working-copy" not in result.stdout:
        LOGGER.info("No Working Copy remote configured; skipping sync")
        return

    run(f"git -C {repo_path} push working-copy HEAD", dry_run=dry_run)

    repo_name = os.path.basename(os.path.abspath(repo_path))
    url = f"working-copy://x-callback-url/pull?repo={repo_name}"
    if dry_run:
        LOGGER.info("DRY RUN: would open %s", url)
    else:  # pragma: no cover - requires iOS environment
        try:
            webbrowser.open(url)
            LOGGER.info("Triggered Working Copy pull via URL scheme")
        except Exception as exc:  # pragma: no cover - logging only
            LOGGER.warning("Failed to open Working Copy URL: %s", exc)

    trigger_working_copy_pull(repo_name, dry_run=dry_run)


def redeploy_droplet(*, dry_run: bool = False) -> None:
    """Placeholder for redeploying the BlackRoad droplet."""
    # TODO: SSH into droplet, pull latest code, run migrations, restart services.
    LOGGER.info("TODO: implement droplet redeploy")


def sync_connectors(*, dry_run: bool = False) -> None:
    """Placeholder for syncing external connectors."""
    # TODO: add OAuth flows, webhook listeners, and Slack notifications.
    LOGGER.info("TODO: implement connector sync")


def trigger_working_copy_pull(
    repo_name: str, *, server_url: str = "http://localhost:8081", dry_run: bool = False
) -> bool:
    """Trigger a pull via Working Copy's local automation server.

    Returns ``True`` if the request succeeded, ``False`` otherwise.
    """

    url = f"{server_url}/pull?repo={repo_name}"
    LOGGER.info("Requesting Working Copy pull: %s", url)
    if dry_run:
        return True
    try:
        with request.urlopen(url) as resp:  # noqa: S310 - local request
            LOGGER.info("Working Copy pull response: %s", resp.read())
        return True
    except error.URLError as exc:
        LOGGER.warning("Working Copy pull failed: %s", exc)
        return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="BlackRoad Codex pipeline scaffold",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate actions without executing external commands",
    )
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("push", help="Push latest to BlackRoad.io")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    sub.add_parser("rebase", help="Rebase branch and update site")
    sub.add_parser("sync", help="Sync Salesforce → Airtable → Droplet")

    args = parser.parse_args(argv)

    if args.command == "push":
        push_latest(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "refresh":
        push_latest(dry_run=args.dry_run)
        refresh_working_copy(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "rebase":
        run("git pull --rebase", dry_run=args.dry_run)
        push_latest(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "sync":
        sync_connectors(dry_run=args.dry_run)
    else:
        parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
