#!/usr/bin/env python3
"""Unified Codex build script scaffold.

This script sketches an end-to-end flow from local development to the live
BlackRoad.io deployment.  It exposes a chat-first interface so operators can
issue high level commands that trigger git pushes, connector syncs, working
copy refreshes and droplet deployments.  The heavy lifting for OAuth, webhooks
and service-specific logic is intentionally left as placeholders.
"""
from __future__ import annotations

import argparse
import shlex
import subprocess
from typing import List, Callable, Dict

# --------------------------- constants ---------------------------

GIT_REMOTE = "origin"
DEFAULT_BRANCH = "main"
WORKING_COPY_PATH = "/opt/blackroad/working_copy"
DROPLET_HOST = "blackroad@droplet"
DROPLET_PATH = "/srv/blackroad"

# --------------------------- helpers ---------------------------

def run(cmd: str, cwd: str | None = None) -> None:
    """Run a shell command, streaming output."""
    print(f"Running: {cmd}")
    subprocess.run(shlex.split(cmd), cwd=cwd, check=False)

# --------------------------- core actions ---------------------------

def push_latest(branch: str = DEFAULT_BRANCH) -> None:
    """Commit any staged changes and push to GitHub."""
    run("git add -A")
    run('git commit -m "codex: automated commit" || echo "nothing to commit"')
    run(f"git push {GIT_REMOTE} {branch}")

def rebase(branch: str = DEFAULT_BRANCH) -> None:
    """Rebase current branch onto the default branch."""
    run(f"git fetch {GIT_REMOTE}")
    run(f"git rebase {GIT_REMOTE}/{branch}")

def refresh_working_copy(path: str = WORKING_COPY_PATH) -> None:
    """Update the iOS Working Copy checkout."""
    run("git fetch", cwd=path)
    run(f"git checkout {DEFAULT_BRANCH}", cwd=path)
    run("git pull", cwd=path)

def deploy_droplet(host: str = DROPLET_HOST, path: str = DROPLET_PATH) -> None:
    """Pull and restart services on the droplet."""
    cmds: List[str] = [
        f"cd {path}",
        "git pull",
        "npm install --production || true",
        "python manage.py migrate || true",
        "sudo systemctl restart blackroad-api || true",
        "sudo systemctl restart blackroad-llm || true",
        "sudo systemctl reload nginx || true",
    ]
    remote = " && ".join(cmds)
    run(f"ssh {host} '{remote}'")

def sync_connectors() -> None:
    """Placeholder connector sync step."""
    print("Syncing connectors (Salesforce, Airtable, Slack, Linear)...")
    # TODO: implement OAuth flows and webhook handling

# --------------------------- command dispatch ---------------------------

COMMANDS: Dict[str, Callable[[], None]] = {
    "push": push_latest,
    "refresh": refresh_working_copy,
    "deploy": deploy_droplet,
    "rebase": rebase,
    "sync": sync_connectors,
}

ALIASES = {
    "Push latest to BlackRoad.io": ["push", "sync", "refresh", "deploy"],
    "Refresh working copy and redeploy": ["refresh", "deploy"],
    "Rebase branch and update site": ["rebase", "deploy"],
    "Sync Salesforce -> Airtable -> Droplet": ["sync", "deploy"],
}

def run_prompt(prompt: str) -> None:
    """Execute a high-level prompt or direct command."""
    if prompt in COMMANDS:
        COMMANDS[prompt]()
        return
    for alias, steps in ALIASES.items():
        if prompt.lower() == alias.lower():
            for step in steps:
                COMMANDS[step]()
            return
    print(f"Unknown command: {prompt}")

# --------------------------- entry point ---------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Codex deployment scaffold")
    parser.add_argument("command", help="natural language command or keyword")
    args = parser.parse_args()
    run_prompt(args.command)

if __name__ == "__main__":
    main()
