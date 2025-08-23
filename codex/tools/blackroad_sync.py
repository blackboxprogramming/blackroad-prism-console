#!/usr/bin/env python3
"""BlackRoad Sync Pipeline

This utility orchestrates the end-to-end flow from Codex to the live
BlackRoad.io deployment.  It offers both explicit flags and a small
natural-language dispatcher so operators can type commands like
"Push latest to BlackRoad.io" and have the underlying git, connector,
working copy and droplet steps executed in sequence.

The implementation focuses on scaffolding; most steps are placeholders
that expect environment variables or external services to be configured
elsewhere.  Each function logs its work and raises on failure so Codex
can surface issues to downstream agents.

Usage examples:
    python3 codex/tools/blackroad_sync.py --push
    python3 codex/tools/blackroad_sync.py --refresh
    python3 codex/tools/blackroad_sync.py --rebase main
    python3 codex/tools/blackroad_sync.py --sync-connectors
    python3 codex/tools/blackroad_sync.py "Push latest to BlackRoad.io"
"""

import argparse
import os
import shlex
import subprocess
import sys
from typing import List


def run(cmd: List[str] | str, cwd: str | None = None) -> str:
    """Run *cmd* returning stdout, raising on non-zero exit."""
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"Command failed: {' '.join(cmd)}\n{proc.stdout}{proc.stderr}"
        )
    return proc.stdout.strip()


# ---------------------------------------------------------------------------
# Git operations
# ---------------------------------------------------------------------------

def git_push() -> None:
    print("Pushing to GitHub...")
    run("git push")


def git_pull() -> None:
    print("Pulling latest from GitHub...")
    run("git pull --ff-only")


def git_rebase(branch: str) -> None:
    print(f"Rebasing current branch onto origin/{branch}...")
    run(f"git fetch origin {branch}")
    run(f"git rebase origin/{branch}")


# ---------------------------------------------------------------------------
# Connector / external systems (placeholders)
# ---------------------------------------------------------------------------

def trigger_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    print("Triggering external connector jobs (placeholder)...")


def post_slack(message: str) -> None:
    """Placeholder for sending a Slack status update."""
    slack_webhook = os.environ.get("SLACK_WEBHOOK")
    if slack_webhook:
        try:
            run(["curl", "-X", "POST", slack_webhook, "-H", "Content-Type: application/json", "-d", f'{{"text": "{message}"}}'])
        except Exception as exc:
            print(f"Failed to post Slack update: {exc}")
    else:
        print("No SLACK_WEBHOOK configured; skipping Slack notification.")


# ---------------------------------------------------------------------------
# Working Copy & Droplet operations
# ---------------------------------------------------------------------------

def refresh_working_copy(path: str | None = None) -> None:
    """Run git pull in a Working Copy checkout (if configured)."""
    wc_path = path or os.environ.get("WORKING_COPY_PATH")
    if not wc_path:
        print("No working copy path configured; skipping working copy refresh.")
        return
    print(f"Refreshing Working Copy at {wc_path}...")
    run("git pull --ff-only", cwd=wc_path)


def deploy_droplet(host: str | None = None) -> None:
    """SSH to the droplet and pull/restart services."""
    droplet = host or os.environ.get("DROPLET_HOST")
    if not droplet:
        print("No DROPLET_HOST configured; skipping droplet deploy.")
        return
    print(f"Deploying to droplet {droplet}...")
    cmd = (
        "cd /srv/blackroad-api && git pull && "
        "npm install --production && "
        "npm run migrate && "
        "sudo systemctl restart blackroad"
    )
    run(["ssh", droplet, cmd])


# ---------------------------------------------------------------------------
# Natural language dispatcher
# ---------------------------------------------------------------------------

def dispatch(text: str) -> None:
    """Map loose natural language commands to actions."""
    t = text.lower()
    if "push" in t and "blackroad.io" in t:
        orchestrate_push()
    elif "refresh" in t and "redeploy" in t:
        orchestrate_refresh()
    elif "rebase" in t and "update" in t:
        orchestrate_rebase("main")
    elif "sync" in t and "salesforce" in t:
        orchestrate_connector_sync()
    else:
        print("No action matched for:", text)


# ---------------------------------------------------------------------------
# Orchestration helpers
# ---------------------------------------------------------------------------

def orchestrate_push() -> None:
    git_push()
    trigger_connectors()
    refresh_working_copy()
    deploy_droplet()
    post_slack("Push completed and deployment triggered.")


def orchestrate_refresh() -> None:
    git_pull()
    refresh_working_copy()
    deploy_droplet()
    post_slack("Refresh and redeploy completed.")


def orchestrate_rebase(branch: str) -> None:
    git_rebase(branch)
    git_push()
    deploy_droplet()
    post_slack(f"Rebased {branch} and updated deployment.")


def orchestrate_connector_sync() -> None:
    trigger_connectors()
    deploy_droplet()
    post_slack("Connector sync and deploy completed.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad end-to-end sync orchestrator")
    parser.add_argument("command", nargs="*", help="optional natural language command")
    parser.add_argument("--push", action="store_true", help="Push latest to BlackRoad.io")
    parser.add_argument("--refresh", action="store_true", help="Refresh working copy and redeploy")
    parser.add_argument("--rebase", metavar="BRANCH", help="Rebase branch and update site")
    parser.add_argument("--sync-connectors", action="store_true", help="Sync Salesforce -> Airtable -> Droplet")
    args = parser.parse_args()

    if args.command:
        dispatch(" ".join(args.command))
        return
    if args.push:
        orchestrate_push()
        return
    if args.refresh:
        orchestrate_refresh()
        return
    if args.rebase:
        orchestrate_rebase(args.rebase)
        return
    if args.sync_connectors:
        orchestrate_connector_sync()
        return
    parser.print_help()


if __name__ == "__main__":  # pragma: no cover
    main()
