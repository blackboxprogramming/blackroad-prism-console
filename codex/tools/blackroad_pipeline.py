#!/usr/bin/env python3
"""BlackRoad Codex pipeline scaffold.

This script provides a chat-style interface for common repository and
deployment operations. Real integrations are left as TODOs but the
structure allows extending to the full BlackRoad.io sync and deploy
workflow.
"""

import subprocess
import sys


def run(cmd: list[str]):
    """Run a shell command and raise if it fails."""
    subprocess.run(cmd, check=True)


def push_latest_to_blackroad():
    """Push local changes to the default remote and branch."""
    print("Pulling with rebase and pushing to origin...")
    run(["git", "pull", "--rebase"])
    run(["git", "push"])
    print("TODO: trigger downstream connectors and deployment")


def refresh_working_copy_and_redeploy():
    """Refresh local repo and redeploy services."""
    push_latest_to_blackroad()
    print("TODO: run remote deploy scripts on droplet")


def rebase_branch_and_update_site():
    """Rebase current branch on origin/main and update deployment."""
    print("Fetching latest from origin...")
    run(["git", "fetch", "origin"])
    print("Rebasing onto origin/main...")
    run(["git", "rebase", "origin/main"])
    push_latest_to_blackroad()
    print("TODO: restart services after deploy")


def sync_salesforce_airtable_droplet():
    """Placeholder for Salesforce -> Airtable -> Droplet sync."""
    print("TODO: implement Salesforce/Airtable connectors and droplet sync")


COMMANDS = {
    "push latest to blackroad.io": push_latest_to_blackroad,
    "refresh working copy and redeploy": refresh_working_copy_and_redeploy,
    "rebase branch and update site": rebase_branch_and_update_site,
    "sync salesforce \u2192 airtable \u2192 droplet": sync_salesforce_airtable_droplet,
}


def main():
    if len(sys.argv) < 2:
        print("Available commands:")
        for cmd in COMMANDS:
            print(f" - {cmd}")
        return

    text = " ".join(sys.argv[1:]).lower()
    func = COMMANDS.get(text)
    if func is None:
        print(f"Unknown command: {text}")
        return

    func()


if __name__ == "__main__":
    main()
