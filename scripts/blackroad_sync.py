#!/usr/bin/env python3
"""Scaffold BlackRoad end-to-end sync and deploy.

This lightweight orchestrator wires together the minimum steps for pushing
local changes to the live BlackRoad.io environment. It intentionally focuses on
being extensible rather than feature complete. Each stage is implemented as a
function so operators or other automations can plug in additional behaviour.

Steps performed:
1. Push the current branch to GitHub.
2. Notify external connectors via a generic webhook.
3. Refresh a Working Copy checkout if configured.
4. Deploy to the remote droplet and restart services.

Environment variables provide runtime configuration:
- ``BRANCH`` and ``REMOTE`` override the git target.
- ``CONNECTOR_WEBHOOK`` points to a HTTP endpoint for connector fan-out.
- ``WORKING_COPY_PATH`` specifies a local path to "Working Copy" on iOS.
- ``DROPLET_SSH`` is an ``user@host`` style target for SSH.
- ``DROPLET_DEPLOY_CMD`` customises the remote deploy command.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from typing import List


def run(cmd: List[str]) -> None:
    """Run a command, streaming output to the console."""
    print("$", " ".join(cmd))
    subprocess.run(cmd, check=True)


def push_to_github(remote: str, branch: str) -> None:
    """Push the current branch to the configured remote."""
    run(["git", "push", remote, branch])


def trigger_connectors() -> None:
    """POST to the connector webhook if configured."""
    webhook = os.environ.get("CONNECTOR_WEBHOOK")
    if not webhook:
        print("No CONNECTOR_WEBHOOK set; skipping connector trigger.")
        return
    try:
        run(["curl", "-fsSL", "-X", "POST", webhook])
    except subprocess.CalledProcessError as exc:  # pragma: no cover - logged to stderr
        print(f"Connector trigger failed: {exc}", file=sys.stderr)


def refresh_working_copy() -> None:
    """Sync a Working Copy checkout if WORKING_COPY_PATH is provided."""
    wc_path = os.environ.get("WORKING_COPY_PATH")
    if not wc_path:
        print("No WORKING_COPY_PATH set; skipping working copy refresh.")
        return
    run(["git", "-C", wc_path, "pull", "--rebase"])


def deploy_to_droplet() -> None:
    """SSH into the droplet and pull latest changes."""
    droplet = os.environ.get("DROPLET_SSH")
    if not droplet:
        print("No DROPLET_SSH set; skipping droplet deploy.")
        return
    remote_cmd = os.environ.get(
        "DROPLET_DEPLOY_CMD",
        "cd /srv/blackroad && git pull && systemctl restart blackroad.service",
    )
    run(["ssh", droplet, remote_cmd])


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad sync and deploy")
    parser.add_argument("--branch", default=os.environ.get("BRANCH", "main"))
    parser.add_argument("--remote", default=os.environ.get("REMOTE", "origin"))
    args = parser.parse_args()

    push_to_github(args.remote, args.branch)
    trigger_connectors()
    refresh_working_copy()
    deploy_to_droplet()


if __name__ == "__main__":
    main()
