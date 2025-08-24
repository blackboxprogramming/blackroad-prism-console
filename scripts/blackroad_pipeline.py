#!/usr/bin/env python3
"""Unified Codex pipeline controller for BlackRoad.

This lightweight scaffold offers a chat-first control surface that maps
high level operator phrases to underlying Git/GitHub, connector, working
copy and droplet deployment actions. Actual integrations with services
such as Salesforce, Airtable or Slack are represented as placeholders so
this script can run in restricted environments while still showing the
expected control flow.

Example usage::

    python scripts/blackroad_pipeline.py "Push latest to BlackRoad.io"
    python scripts/blackroad_pipeline.py "Refresh working copy and redeploy"

"""
from __future__ import annotations

import argparse
import subprocess
from typing import Callable, Dict


def run(cmd: list[str]) -> None:
    """Run a command, printing it first.

    The subprocess call is wrapped so this script can be easily adapted to
    real environments. Failed commands will raise an exception which callers
    can catch for retry logic.
    """
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


# ---------- pipeline step placeholders ----------


def sync_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    print("syncing connectors ... (placeholder)")


def refresh_working_copy() -> None:
    """Placeholder for Working Copy automation."""
    print("refreshing working copy ... (placeholder)")


def deploy_droplet() -> None:
    """Placeholder for droplet deployment logic."""
    print("deploying to droplet ... (placeholder)")


def push_latest() -> None:
    """Push local commits and trigger full pipeline."""
    run(["git", "push"])
    sync_connectors()
    refresh_working_copy()
    deploy_droplet()


def refresh_and_redeploy() -> None:
    """Refresh working copy and redeploy droplet."""
    refresh_working_copy()
    deploy_droplet()


def rebase_and_update() -> None:
    """Rebase with upstream before running the full pipeline."""
    run(["git", "pull", "--rebase"])
    push_latest()


def sync_connectors_only() -> None:
    """Run connector sync without touching code."""
    sync_connectors()


COMMANDS: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": push_latest,
    "refresh working copy and redeploy": refresh_and_redeploy,
    "rebase branch and update site": rebase_and_update,
    "sync salesforce -> airtable -> droplet": sync_connectors_only,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Codex pipeline controller")
    parser.add_argument("phrase", help="operator phrase describing the action")
    args = parser.parse_args()

    phrase = args.phrase.strip().lower()
    action = COMMANDS.get(phrase)
    if not action:
        print("Unrecognised phrase. Supported commands:")
        for key in COMMANDS:
            print("  -", key)
        raise SystemExit(1)
    action()
"""
BlackRoad Codex pipeline orchestration.

Provides a chat-first interface to push code to GitHub, sync connectors,
refresh Working Copy, and deploy to the droplet. Steps are logged and retried
on failure to keep BlackRoad.io in sync.
"""
import argparse
import logging
import subprocess
import sys
import time
from pathlib import Path

LOG_DIR = Path("codex/runtime/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "blackroad_pipeline.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)


def run(cmd: str) -> None:
    """Run a shell command and raise if it fails."""
    logging.info("$ %s", cmd)
    res = subprocess.run(cmd, shell=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}")


def run_step(name: str, func, retries: int = 2) -> None:
    """Run a pipeline step with retries."""
    for attempt in range(1, retries + 2):
        try:
            logging.info("Starting: %s", name)
            func()
            logging.info("Finished: %s", name)
            return
        except Exception as exc:  # noqa: BLE001
            logging.exception("%s failed (attempt %s/%s): %s", name, attempt, retries + 1, exc)
            if attempt > retries:
                raise
            time.sleep(2)


def git_push() -> None:
    """Commit, rebase, and push to origin."""
    run("git add -A")
    run("git commit -m 'Codex auto-commit' || true")
    run("git pull --rebase")
    run("git push")


def trigger_connectors() -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear jobs."""
    logging.info("Triggering connector webhooks (not implemented)")


def refresh_working_copy() -> None:
    """Refresh local Working Copy app."""
    run("git pull")


def deploy_droplet() -> None:
    """Update code on droplet and restart services."""
    run("ssh droplet 'cd /srv/blackroad && git pull && npm install --production && pm2 restart all'")


def push_latest() -> None:
    run_step("git push", git_push)
    run_step("connectors", trigger_connectors)
    run_step("working copy refresh", refresh_working_copy)
    run_step("droplet deploy", deploy_droplet)


def refresh_all() -> None:
    run_step("working copy refresh", refresh_working_copy)
    run_step("droplet deploy", deploy_droplet)


def rebase_branch() -> None:
    run_step("git rebase", lambda: run("git pull --rebase"))
    run_step("droplet deploy", deploy_droplet)


def sync_chain() -> None:
    run_step("connector sync", trigger_connectors)
    run_step("droplet deploy", deploy_droplet)

COMMAND_MAP = {
    "push latest to blackroad.io": push_latest,
    "refresh working copy and redeploy": refresh_all,
    "rebase branch and update site": rebase_branch,
    "sync salesforce \u2192 airtable \u2192 droplet": sync_chain,
}


def parse_command(text: str):
    text = text.lower().strip()
    func = COMMAND_MAP.get(text)
    if not func:
        raise SystemExit(f"Unknown command: {text}")
    return func


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad Codex pipeline")
    parser.add_argument("command", help="Chat-style command to execute")
    args = parser.parse_args()
    func = parse_command(args.command)
    try:
        func()
        logging.info("Pipeline completed successfully")
    except Exception as exc:  # noqa: BLE001
        logging.exception("Pipeline failed: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()

