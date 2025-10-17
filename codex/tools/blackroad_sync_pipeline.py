#!/usr/bin/env python3
"""
BlackRoad Sync & Deploy Pipeline

This script provides a scaffold for an end-to-end flow that moves code changes
from the local Codex environment to a live BlackRoad.io deployment.  It handles
these high level steps:

1. Commit and push local changes to GitHub.
2. Trigger connector jobs (Salesforce, Airtable, Slack, Linear, etc.).
3. Refresh any Working Copy instances.
4. Pull and deploy code on the remote droplet.
5. Expose simple natural language commands for operators.

The implementation is intentionally lightweight.  Most actions are thin wrappers
around shell commands or placeholders where integration code can be added later.
"""

import argparse
import os
import subprocess
from typing import List

from tools.atlassian import create_jira_issue

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def run(cmd: List[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run *cmd* and stream output."""
    print(f"$ {' '.join(cmd)}")
    return subprocess.run(cmd, check=check)

# ---------------------------------------------------------------------------
# GitHub integration
# ---------------------------------------------------------------------------

def git_push(message: str = "Sync changes via Codex"):
    """Auto-commit and push any local changes to the origin."""
    run(["git", "add", "-A"])
    try:
        run(["git", "commit", "-m", message])
    except subprocess.CalledProcessError:
        print("No changes to commit.")
    run(["git", "push", "origin", "HEAD"])

# ---------------------------------------------------------------------------
# Connector hooks
# ---------------------------------------------------------------------------

def run_connector_jobs():
    """Run placeholder connector sync jobs with optional Atlassian hook."""

    print("[connectors] run background sync jobs here …")
    try:
        create_jira_issue(
            "Automated sync",
            "Background connector sync triggered by pipeline",
            os.getenv("ATLASSIAN_PROJECT_KEY", "BR"),
        )
        print("[connectors] created JIRA issue")
    except Exception as exc:  # pragma: no cover - best effort
        print(f"[connectors] JIRA integration unavailable: {exc}")
    """Placeholder for connector sync logic.

    Implement OAuth flows and webhook listeners for services such as
    Salesforce, Airtable, Slack and Linear.  This function simply notifies the
    user that connector jobs should run here.
    """
    print("[connectors] run background sync jobs here …")

# ---------------------------------------------------------------------------
# Working Copy automation
# ---------------------------------------------------------------------------

def refresh_working_copy(path: str):
    """Refresh an iOS Working Copy checkout via the `git` CLI."""
    if not os.path.isdir(path):
        print(f"Working Copy path not found: {path}")
        return
    run(["git", "-C", path, "pull", "--rebase"])

# ---------------------------------------------------------------------------
# Droplet deployment
# ---------------------------------------------------------------------------

def deploy_to_droplet(host: str):
    """Pull latest code on the droplet and restart services."""
    deploy_cmd = (
        "cd /srv/blackroad && git pull && "
        "npm run migrate && sudo systemctl restart blackroad"
    )
    run(["ssh", host, deploy_cmd])

# ---------------------------------------------------------------------------
# Chat-style command interface
# ---------------------------------------------------------------------------

def handle_instruction(text: str, wc_path: str, droplet_host: str):
    text_l = text.lower()
    if "push" in text_l and "blackroad.io" in text_l:
        git_push()
        run_connector_jobs()
        refresh_working_copy(wc_path)
        deploy_to_droplet(droplet_host)
    elif "refresh" in text_l and "working copy" in text_l:
        refresh_working_copy(wc_path)
        deploy_to_droplet(droplet_host)
    elif "rebase" in text_l:
        run(["git", "pull", "--rebase", "origin", "main"])
        deploy_to_droplet(droplet_host)
    elif "sync" in text_l and "salesforce" in text_l:
        run_connector_jobs()
    else:
        print(f"Instruction not recognised: {text}")

# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="BlackRoad sync and deploy helper")
    ap.add_argument("--cmd", help="Natural language instruction to execute")
    ap.add_argument("--working-copy", default=os.environ.get("WORKING_COPY", ""),
                    help="Path to local Working Copy checkout")
    ap.add_argument("--droplet", default=os.environ.get("DROPLET_HOST", ""),
                    help="SSH host for the production droplet")
    args = ap.parse_args()

    if not args.cmd:
        ap.error("--cmd is required")

    handle_instruction(args.cmd, args.working_copy, args.droplet)

if __name__ == "__main__":
    main()
