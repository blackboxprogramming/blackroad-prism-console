#!/usr/bin/env python3
"""Codex job orchestrating GitHub→Droplet sync for BlackRoad.io.

This lightweight helper stitches together several deployment steps:

* pushes local commits to GitHub
* triggers connector sync placeholders
* refreshes the iOS Working Copy repo
* pulls and restarts services on the droplet
* performs basic health checks

It is intentionally minimal and meant to be extended with
real OAuth flows, webhook handlers and error reporting.
"""
from __future__ import annotations

import os
import shlex
import subprocess
import sys
from typing import Callable, Dict


def run(cmd: str) -> None:
    """Run *cmd* in a shell and raise if it fails."""
    print(f"+ {cmd}")
    subprocess.run(cmd, shell=True, check=True)


def push_latest() -> None:
    """Push local commits and run the full deployment pipeline."""
    run("git push origin HEAD")
    sync_connectors()
    refresh_working_copy()
    deploy_to_droplet()


def sync_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    print("[connectors] TODO: implement OAuth flows and metadata sync")


def refresh_working_copy() -> None:
    """Sync the iOS Working Copy mirror of the repository."""
    host = os.environ.get("WORKING_COPY_HOST", "working-copy")
    repo = os.environ.get("WORKING_COPY_REPO", "~/blackroad")
    cmd = f"ssh {host} 'cd {repo} && git pull --rebase'"
    run(cmd)


def deploy_to_droplet() -> None:
    """Pull latest code on the droplet and restart services."""
    host = os.environ.get("DROPLET_HOST", "blackroad.io")
    user = os.environ.get("DROPLET_USER", "root")
    ssh_target = f"{user}@{host}"
    remote_cmd = "cd /srv/blackroad && git pull --ff-only && npm ci && npm run migrate && sudo systemctl restart blackroad-api nginx"
    run(f"ssh {ssh_target} {shlex.quote(remote_cmd)}")
    run(f"curl -fsS https://{host}/health")
    run(f"curl -fsS https://{host}/deploy/status")


def rebase_and_update_site() -> None:
    """Rebase the current branch on origin/main and deploy."""
    run("git fetch origin")
    run("git rebase origin/main")
    push_latest()


def sync_salesforce_airtable_droplet() -> None:
    """Sync connectors then deploy to the droplet."""
    sync_connectors()
    deploy_to_droplet()


COMMANDS: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": push_latest,
    "refresh working copy and redeploy": lambda: (refresh_working_copy(), deploy_to_droplet()),
    "rebase branch and update site": rebase_and_update_site,
    "sync salesforce → airtable → droplet": sync_salesforce_airtable_droplet,
}


def main(argv: list[str]) -> None:
    if len(argv) < 2:
        print("Available commands:")
        for k in COMMANDS:
            print(f"  - {k}")
        sys.exit(1)
    cmd = " ".join(argv[1:]).lower()
    func = COMMANDS.get(cmd)
    if not func:
        print(f"Unknown command: {cmd}")
        sys.exit(2)
    func()


if __name__ == "__main__":
    main(sys.argv)
