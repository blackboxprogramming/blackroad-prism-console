#!/usr/bin/env python3
"""Unified build pipeline for BlackRoad.io deployments.

This script scaffolds the Codex build flow that links together the
various moving pieces required to push code changes live on
BlackRoad.io.  The flow is intentionally light‑weight and only contains
placeholders for the external systems.  Each step prints the command it
*would* run so that future implementations can fill in the details.

Usage examples::
"""Unified Codex build script for BlackRoad.io

This script scaffolds an end-to-end workflow that mirrors code from the
local repo to production. It wraps git operations, connector placeholders,
Working Copy sync and droplet deploy into a single control surface.

Commands can be issued in plain English:

    python3 codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io"
    python3 codex/tools/blackroad_pipeline.py "Refresh working copy and redeploy"
    python3 codex/tools/blackroad_pipeline.py "Rebase branch and update site"
    python3 codex/tools/blackroad_pipeline.py "Sync Salesforce -> Airtable -> Droplet"

The parser is intentionally forgiving – it lower‑cases the input and
checks for key phrases to determine the requested action.
The script relies on environment variables for tokens and remote hosts:

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
    """Commit and push local changes to GitHub.

    This function assumes that the working directory is already staged.
    It performs a commit and push, surfacing any errors to the caller.
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
    """Run one of the supported high‑level actions."""
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

"""Unified deployment scaffolding for BlackRoad.io.

This script provides a placeholder control surface for Codex
operators. It models the sequential steps required to propagate
repository changes through GitHub, connector services, working copy
refreshes, and droplet deployments. Real integrations should replace
these stubs with concrete logic for the target environment.

Usage examples:
    python codex/tools/blackroad_pipeline.py push
    python codex/tools/blackroad_pipeline.py refresh
    python codex/tools/blackroad_pipeline.py rebase
    python codex/tools/blackroad_pipeline.py sync
    python codex/tools/blackroad_pipeline.py all
"""
from __future__ import annotations

import subprocess
import sys
from typing import Callable, Dict


def run(cmd: str) -> int:
    """Run a shell command and return the exit code.

    This helper prints the command so operators can follow the flow.
    """
    print(f"[blackroad] $ {cmd}")
    return subprocess.call(cmd, shell=True)


def push_latest() -> None:
    """Push local commits to the default remote."""
    run("git push")


def refresh_working_copy() -> None:
    """Fast-forward the local checkout."""
    run("git pull --ff-only")


def rebase_branch() -> None:
    """Rebase current branch onto origin/main."""
    run("git fetch origin")
    run("git rebase origin/main")


def sync_connectors() -> None:
    """Placeholder for syncing external systems.

    OAuth flows, webhook listeners and background jobs should be
    implemented here. This stub merely logs the requested action.
    """
    print("sync_connectors: not yet implemented")


def deploy_droplet() -> None:
    """Placeholder for pulling latest code onto the droplet and
    restarting services.

    Real deployments may use SSH or other orchestration tools to
    update code, run database migrations and expose health checks.
    """
    print("deploy_droplet: not yet implemented")


COMMANDS: Dict[str, Callable[[], None]] = {
    "push": lambda: (push_latest(), deploy_droplet()),
    "refresh": refresh_working_copy,
    "rebase": lambda: (rebase_branch(), deploy_droplet()),
    "sync": lambda: (sync_connectors(), deploy_droplet()),
    "all": lambda: (push_latest(), sync_connectors(), refresh_working_copy(), deploy_droplet()),
}


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "all"
    action = COMMANDS.get(cmd)
    if action is None:
        print("Usage: blackroad_pipeline.py [push|refresh|rebase|sync|all]")
        return 2
    action()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
