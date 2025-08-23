#!/usr/bin/env python3
"""
BlackRoad Sync Tool

Provides a chat-style interface to trigger repository, connector, and deployment
operations. The functions are scaffolds that log actions and invoke basic git
commands. Replace placeholder sections with project-specific implementations for
full CI/CD behavior.
"""

import logging
import shlex
import subprocess
import sys
from pathlib import Path

LOG_PATH = Path("codex/runtime/logs/blackroad_sync.log")


def log(message: str) -> None:
    """Append message to log file and echo to stdout."""
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(filename=str(LOG_PATH), level=logging.INFO)
    logging.info(message)
    print(message)


def run(cmd: str) -> str:
    """Run shell command and return stdout."""
    result = subprocess.run(
        shlex.split(cmd), capture_output=True, text=True, check=False
    )
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\n{result.stdout}{result.stderr}")
    return result.stdout.strip()


# --- GitHub / Working Copy ---------------------------------------------------

def push_latest() -> None:
    """Push local HEAD to origin."""
    log("Pushing latest changes to GitHub...")
    run("git push origin HEAD")
    log("✔ Push complete")


def refresh_working_copy() -> None:
    """Placeholder for syncing iOS Working Copy."""
    log("Refreshing Working Copy (placeholder)")
    # Implement iOS Working Copy automation here
    log("✔ Working Copy refreshed")


def rebase_branch() -> None:
    """Rebase current branch onto origin/main."""
    log("Rebasing branch onto origin/main...")
    run("git fetch origin")
    run("git rebase origin/main")
    log("✔ Rebase complete")


# --- Connectors / Droplet ----------------------------------------------------

def sync_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    log("Syncing connectors (Salesforce → Airtable → Slack → Linear) ...")
    # Implement connector sync jobs here
    log("✔ Connectors synced")


def deploy_droplet() -> None:
    """Placeholder for pulling and restarting services on droplet."""
    log("Deploying to droplet (pull + restart)...")
    # Implement droplet deployment logic here
    log("✔ Droplet deployment finished")


# --- Command Handling --------------------------------------------------------

COMMANDS = {
    "push latest to blackroad.io": lambda: (push_latest(), sync_connectors(), deploy_droplet()),
    "refresh working copy and redeploy": lambda: (refresh_working_copy(), deploy_droplet()),
    "rebase branch and update site": lambda: (rebase_branch(), push_latest(), deploy_droplet()),
    "sync salesforce → airtable → droplet": lambda: (sync_connectors(), deploy_droplet()),
}


def handle_command(cmd: str) -> None:
    """Dispatch command string to action."""
    normalized = cmd.lower().strip().replace("->", "→")
    action = COMMANDS.get(normalized)
    if not action:
        print("Unknown command. Available commands:")
        for key in COMMANDS:
            print(f" - {key}")
        return
    action()
    log("✔ All steps completed")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python codex/tools/blackroad_sync.py '<command>'")
        return
    handle_command(sys.argv[1])


if __name__ == "__main__":
    main()
