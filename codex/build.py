#!/usr/bin/env python3
"""Codex build orchestrator for BlackRoad.io.

This script provides a chat-friendly interface for executing common
end-to-end tasks in the BlackRoad deployment pipeline.  Each command is a
step toward the goal of pushing repository changes through GitHub,
connector jobs, working copy refreshes, and droplet deployments.

The current implementation focuses on scaffolding.  Networking calls to
external services (Slack, Salesforce, Airtable, etc.) are left as
placeholders so the pipeline can be extended incrementally.
"""

from __future__ import annotations

import argparse
import shlex
import subprocess
from pathlib import Path

LOG_FILE = Path("build.log")
ERROR_LOG_FILE = Path("build_errors.log")


def log(message: str) -> None:
    """Log a message to stdout and the build log."""
    print(message)
    with LOG_FILE.open("a", encoding="utf-8") as fh:
        fh.write(message + "\n")


def log_error(message: str) -> None:
    """Log an error message to stdout and the error log."""
    print(message)
    with ERROR_LOG_FILE.open("a", encoding="utf-8") as fh:
        fh.write(message + "\n")


def run(cmd: str, cwd: Path | None = None) -> tuple[int, str]:
    """Run a shell command, logging output and returning (code, output)."""
    log(f"$ {cmd}")
    result = subprocess.run(
        shlex.split(cmd),
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    output = result.stdout.strip()
    if output:
        log(output)
    if result.returncode != 0:
        log_error(f"Command '{cmd}' failed with exit code {result.returncode}")
        if output:
            log_error(output)
    return result.returncode, output



# ---------------------------------------------------------------------------
# GitHub / repo operations
# ---------------------------------------------------------------------------

AUTO_COMMIT_MESSAGE = "Automated commit by codex"


def push_to_github(branch: str = "main") -> None:
    """Commit local changes and push to GitHub."""
    try:
        code, _ = run("git add .")
        if code != 0:
            raise RuntimeError("git add failed")

        code, status = run("git status --porcelain")
        if code != 0:
            raise RuntimeError("git status failed")

        if status.strip():
            code, _ = run(f'git commit -m "{AUTO_COMMIT_MESSAGE}"')
            if code != 0:
                raise RuntimeError("git commit failed")
        else:
            log("No changes to commit.")

        code, _ = run(f"git push origin {branch}")
        if code != 0:
            raise RuntimeError("git push failed")
    except RuntimeError as err:
        log_error(str(err))
        raise


def pull_from_github(branch: str = "main") -> None:
    """Fetch and pull from GitHub, detecting merge conflicts."""
    try:
        code, _ = run("git fetch")
        if code != 0:
            raise RuntimeError("git fetch failed")

        code, _ = run(f"git pull --no-rebase origin {branch}")
        _, conflicts = run("git ls-files -u")
        if conflicts.strip():
            log_error("Merge conflicts detected:")
            log_error(conflicts)
            raise RuntimeError("Unresolved merge conflicts")
        if code != 0:
            raise RuntimeError("git pull failed")
    except RuntimeError as err:
        log_error(str(err))
        raise


def rebase_branch(branch: str = "main") -> None:
    """Rebase the current branch onto the specified branch."""
    code, _ = run(f"git fetch origin {branch}")
    if code != 0:
        raise RuntimeError("git fetch failed")
    code, _ = run(f"git rebase origin/{branch}")
    if code != 0:
        raise RuntimeError("git rebase failed")


# ---------------------------------------------------------------------------
# Connector and deployment placeholders
# ---------------------------------------------------------------------------

def sync_connectors() -> None:
    """Synchronise external connectors (Salesforce, Airtable, etc.).

    This is a placeholder for OAuth setup and webhook processing.  Extend
    this function with project-specific connector logic as needed.
    """

    print("[connectors] TODO: implement OAuth and webhook logic")


def deploy_to_droplet() -> None:
    """Deploy the latest code to the droplet.

    Actual deployment commands (git pull, migrations, service restarts)
    should be added here.  The function currently acts as a stub so the
    broader orchestration flow can be wired up without side effects.
    """

    print("[droplet] TODO: implement remote deployment commands")


# ---------------------------------------------------------------------------
# Chat-first control surface
# ---------------------------------------------------------------------------

def handle_command(cmd: str) -> None:
    actions = {
        "push": push_to_github,
        "pull": pull_from_github,
        "rebase": rebase_branch,
        "sync": sync_connectors,
    }
    action = actions.get(cmd)
    if action:
        action()
    else:
        print(f"Unknown command: {cmd}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Codex build pipeline")
    parser.add_argument("command", help="push|pull|rebase|sync")
    parser.add_argument(
        "branch",
        nargs="?",
        default="main",
        help="branch name for rebase (default: main)",
    )
    args = parser.parse_args()

    if args.command == "rebase":
        rebase_branch(args.branch)
    else:
        handle_command(args.command)


if __name__ == "__main__":
    main()
