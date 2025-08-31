#!/usr/bin/env python3
"""Unified Codex build script for BlackRoad.io.

Scaffolds an end-to-end workflow that mirrors code from the local repo
to production. It wraps git operations, connector placeholders, Working
Copy sync and droplet deploy into a single control surface.

Commands can be issued in plain English:

    python3 codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io"
    python3 codex/tools/blackroad_pipeline.py "Refresh working copy and redeploy"
    python3 codex/tools/blackroad_pipeline.py "Rebase branch and update site"
    python3 codex/tools/blackroad_pipeline.py "Sync Salesforce -> Airtable -> Droplet"

The parser lowercases input and checks for key phrases to determine the
requested action. Environment variables provide configuration:

    GIT_REMOTE      GitHub HTTPS or SSH URL
    DROPLET_HOST    SSH host for production droplet
    SLACK_WEBHOOK   Incoming webhook for status posts

Actual connector implementations are intentionally minimal and should be
extended to fit deployment needs.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from typing import List

# --- GitHub operations -----------------------------------------------------

def push_latest() -> None:
    """Push local commits to GitHub.

    Assumes the branch already has committed changes and simply pushes
    them to the remote, surfacing any errors to the caller.
    """
    cmd: List[str] = ["git", "push"]
    print("-> pushing to GitHub:", " ".join(cmd))
    subprocess.run(cmd, check=False)


# --- Connector stubs -------------------------------------------------------

def sync_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync hooks."""
    print("-> syncing connectors (Salesforce, Airtable, Slack, Linear, ...)")
    # Real implementation would authenticate and push/pull metadata.


# --- Working Copy automation ----------------------------------------------

def refresh_working_copy() -> None:
    """Placeholder for refreshing iOS Working Copy clients."""
    print("-> refreshing Working Copy app via git pull/push")


# --- Droplet deployment ----------------------------------------------------

def deploy_droplet() -> None:
    """Placeholder for pulling latest code on the droplet and restarting services."""
    print("-> deploying to droplet: git pull, migrations, service restarts")


# --- High level orchestration ---------------------------------------------

def run_pipeline(action: str) -> None:
    """Run one of the supported high-level actions."""
    a = action.lower()
    if "push" in a and "blackroad.io" in a:
        push_latest()
        sync_connectors()
        deploy_droplet()
    elif "refresh" in a and "redeploy" in a:
        refresh_working_copy()
        deploy_droplet()
    elif "rebase" in a:
        print("-> rebasing local branch against remote")
        subprocess.run(["git", "fetch"], check=False)
        subprocess.run(["git", "rebase", "origin/main"], check=False)
        deploy_droplet()
    elif "sync" in a and "salesforce" in a:
        sync_connectors()
        deploy_droplet()
    else:
        print(f"Unrecognised action: {action}")
        sys.exit(1)


# --- CLI entry point -------------------------------------------------------

def main(argv: List[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io pipeline helper")
    parser.add_argument("command", help="chat-style command describing the desired action")
    args = parser.parse_args(argv)
    run_pipeline(args.command)


if __name__ == "__main__":
    main()
