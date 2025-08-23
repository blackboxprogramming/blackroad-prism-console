#!/usr/bin/env python3
"""Unified Codex build script for BlackRoad.io

This script scaffolds an end-to-end workflow that mirrors code from the
local repo to production. It wraps git operations, connector placeholders,
Working Copy sync and droplet deploy into a single control surface.

Commands can be issued in plain English:

    python3 codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io"
    python3 codex/tools/blackroad_pipeline.py "Refresh working copy and redeploy"
    python3 codex/tools/blackroad_pipeline.py "Rebase branch and update site"
    python3 codex/tools/blackroad_pipeline.py "Sync Salesforce -> Airtable -> Droplet"

The script relies on environment variables for tokens and remote hosts:

    GIT_REMOTE      GitHub HTTPS or SSH URL
    DROPLET_HOST    SSH host for production droplet
    SLACK_WEBHOOK   Incoming webhook for status posts

Actual connector implementations are intentionally minimal and should be
extended to fit deployment needs.
"""

from __future__ import annotations

import argparse
import os
import shlex
import subprocess
import sys
from typing import Iterable

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def run(cmd: str | Iterable[str]) -> int:
    """Run a shell command and stream output."""
    if isinstance(cmd, (list, tuple)):
        cmd = " ".join(shlex.quote(c) for c in cmd)
    print(f"$ {cmd}")
    completed = subprocess.run(cmd, shell=True)
    return completed.returncode


def notify(msg: str) -> None:
    """Post a message to Slack if SLACK_WEBHOOK is set."""
    url = os.getenv("SLACK_WEBHOOK")
    if not url:
        return
    try:
        import json
        import urllib.request

        data = json.dumps({"text": msg}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=5).read()
    except Exception as exc:  # pragma: no cover - best effort
        print(f"! slack notification failed: {exc}")


# ---------------------------------------------------------------------------
# pipeline steps
# ---------------------------------------------------------------------------


def git_push() -> None:
    run(["git", "push", os.getenv("GIT_REMOTE", "origin"), "HEAD"])


def refresh_working_copy() -> None:
    run(["git", "pull", os.getenv("GIT_REMOTE", "origin")])


def rebase_branch() -> None:
    run(["git", "fetch", os.getenv("GIT_REMOTE", "origin")])
    run(["git", "rebase", os.getenv("GIT_REMOTE", "origin") + "/main"])


def sync_connectors() -> None:
    print("Syncing connectors (Salesforce, Airtable, Linear, etc.)…")
    # TODO: implement actual connector jobs


def deploy_droplet() -> None:
    host = os.getenv("DROPLET_HOST")
    if not host:
        print("! DROPLET_HOST not set – skipping deploy")
        return
    cmd = (
        f"ssh {shlex.quote(host)} "
        "'cd /srv/blackroad && git pull && npm install --production && npm run build && sudo systemctl restart blackroad'"
    )
    run(cmd)


# ---------------------------------------------------------------------------
# command dispatch
# ---------------------------------------------------------------------------

COMMANDS = {
    "push latest to blackroad.io": [git_push, deploy_droplet],
    "refresh working copy and redeploy": [refresh_working_copy, deploy_droplet],
    "rebase branch and update site": [rebase_branch, deploy_droplet],
    "sync salesforce -> airtable -> droplet": [sync_connectors, deploy_droplet],
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="BlackRoad Codex pipeline")
    parser.add_argument("command", help="English-like command to execute")
    args = parser.parse_args(argv)

    key = args.command.strip().lower()
    steps = COMMANDS.get(key)
    if not steps:
        print(f"Unknown command: {args.command}")
        print("Known commands:")
        for k in COMMANDS:
            print(f"  - {k}")
        return 1

    notify(f"Starting: {args.command}")
    for step in steps:
        step()
    notify(f"Finished: {args.command}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())

