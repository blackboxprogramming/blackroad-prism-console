#!/usr/bin/env python3
"""
BlackRoad Sync (Codex Infinity)
---------------------------------
Unified automation script that wires Codex conversations to the
BlackRoad.io deployment pipeline.  The goal is a single entry point
so operators can type natural language commands and have them flow
through GitHub, connectors, Working Copy on iOS and the production
droplet.

This file intentionally focuses on scaffolding.  Each stage exposes a
function with a minimal implementation and abundant docstrings so human
or machine collaborators can extend the logic.

Current capabilities
~~~~~~~~~~~~~~~~~~~~
* git commit/push with automatic rebase
* skeletal deploy hook via SSH
* connector placeholders (Salesforce/Airtable/Slack/Linear)
* working copy refresh hook
* trivial natural-language command router

Usage examples
==============
```bash
python3 codex/tools/blackroad_sync.py --cmd "Push latest to BlackRoad.io"
python3 codex/tools/blackroad_sync.py --cmd "Refresh working copy and redeploy"
```
"""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Callable, Dict

# --- helpers -----------------------------------------------------------------

def run(cmd: str | list[str], cwd: str | Path | None = None) -> str:
    """Run *cmd* and return stdout; raise RuntimeError on failure."""
    if isinstance(cmd, str):
        cmd_list = shlex.split(cmd)
    else:
        cmd_list = cmd
    p = subprocess.run(
        cmd_list,
        cwd=cwd,
        capture_output=True,
        text=True,
        env=os.environ.copy(),
    )
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd_list)}\n{p.stdout}{p.stderr}")
    return p.stdout.strip()

# --- git stage ----------------------------------------------------------------

def push_latest(repo: str = ".", branch: str = "main") -> None:
    """Commit all changes, pull --rebase and push to origin."""
    run("git add -A", cwd=repo)
    # Commit may noop; that's fine.
    run('git commit -m "chore: sync from Codex" || true', cwd=repo)
    run(f"git pull --rebase origin {branch}", cwd=repo)
    run(f"git push origin {branch}", cwd=repo)

# --- connector stage ----------------------------------------------------------

def sync_connectors() -> None:
    """Placeholder: sync Salesforce, Airtable, Slack and Linear.

    Real implementations will authenticate via OAuth and push/pull data as
    required.  This stub merely logs the intention so downstream agents know
    where to extend.
    """
    print("[connector] sync placeholders executed")

# --- working copy (iOS) -------------------------------------------------------

def refresh_working_copy(path: str = ".") -> None:
    """Placeholder for Working Copy automation.

    A real implementation might talk to the Working Copy URL scheme or a
    small HTTP server running on device.  Here we simply document the hook.
    """
    print(f"[working-copy] would refresh repo at {path}")

# --- droplet deploy -----------------------------------------------------------

def deploy_droplet(host: str, user: str, repo_path: str = "/srv/blackroad") -> None:
    """Minimal SSH-based deploy hook.

    This sends a `git pull` and optionally runs migrations / service restarts.
    Credentials are taken from env vars `SSH_KEY` or agent forwarder.
    """
    ssh_cmd = f"ssh {user}@{host} 'cd {repo_path} && git pull && ./deploy.sh'"
    run(ssh_cmd)

# --- command router -----------------------------------------------------------

CommandFunc = Callable[[], None]


def push_and_deploy() -> None:
    push_latest()
    sync_connectors()
    refresh_working_copy()
    host = os.environ.get("BLACKROAD_DROPLET_HOST", "droplet")
    user = os.environ.get("BLACKROAD_DROPLET_USER", "deploy")
    deploy_droplet(host, user)


COMMANDS: Dict[str, CommandFunc] = {
    "push latest to blackroad.io": push_and_deploy,
    "refresh working copy and redeploy": push_and_deploy,
    "rebase branch and update site": push_and_deploy,
    "sync salesforce -> airtable -> droplet": push_and_deploy,
}


def route_command(cmd: str) -> None:
    key = cmd.lower().strip()
    fn = COMMANDS.get(key)
    if not fn:
        raise SystemExit(f"Unknown command: {cmd}")
    fn()

# --- entry point --------------------------------------------------------------

def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="BlackRoad.io sync utility")
    ap.add_argument("--cmd", help="chat-style command to execute", required=True)
    args = ap.parse_args(argv)
    route_command(args.cmd)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
