#!/usr/bin/env python3
"""BlackRoad.io end-to-end sync & deploy helper.

This script acts as a minimal control surface for orchestrating the
BlackRoad pipeline: GitHub -> connectors -> working copy -> droplet -> live
site.  The goal is to offer a single entry point that higher level agents or
humans can invoke with natural language commands such as::

    "Push latest to BlackRoad.io"
    "Refresh working copy and redeploy"
    "Rebase branch and update site"
    "Sync Salesforce -> Airtable -> Droplet"

All heavy lifting is still handled by the underlying tools (git, ssh, etc.)
but the functions defined here provide the scaffolding to trigger each step
and emit simple Slack notifications.  Real connector logic, OAuth flows and
webhook handling would be implemented by expanding the placeholders below.

Environment variables used:
    WORKING_COPY_DIR   local path used by Working Copy (default: /tmp/wc)
    DROPLET_SSH        host string for ssh (e.g. user@host)
    SLACK_WEBHOOK      Incoming webhook URL for notifications
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import shlex
import subprocess
from pathlib import Path
from typing import Dict, Callable, Awaitable

LOG = logging.getLogger("blackroad")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def run(cmd, cwd: Path | None = None, check: bool = True) -> str:
    """Run *cmd* and return its stdout."""
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    LOG.debug("run: %s", " ".join(cmd))
    proc = subprocess.run(
        cmd, cwd=cwd, capture_output=True, text=True, check=False
    )
    if check and proc.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd)}\n{proc.stdout}\n{proc.stderr}")
    return proc.stdout.strip()


async def post_slack(text: str) -> None:
    hook = os.environ.get("SLACK_WEBHOOK")
    if not hook:
        LOG.info("Slack webhook missing; skipping notification: %s", text)
        return
    import urllib.request

    req = urllib.request.Request(
        hook,
        data=json.dumps({"text": text}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:  # pragma: no cover - best effort
        LOG.warning("Slack notification failed: %s", exc)


# ---------------------------------------------------------------------------
# Connector placeholders
# ---------------------------------------------------------------------------


class Connector:
    """Minimal placeholder representing an external service."""

    def __init__(self, name: str):
        self.name = name

    async def oauth_url(self) -> str:
        return f"https://example.com/oauth/{self.name}"

    async def handle_webhook(self, payload: dict) -> None:
        LOG.info("[%s] webhook: %s", self.name, payload)

    async def sync(self) -> None:
        LOG.info("[%s] sync placeholder", self.name)


CONNECTORS: Dict[str, Connector] = {
    "salesforce": Connector("salesforce"),
    "airtable": Connector("airtable"),
    "slack": Connector("slack"),
    "linear": Connector("linear"),
}


# ---------------------------------------------------------------------------
# core steps
# ---------------------------------------------------------------------------


async def push_latest() -> None:
    LOG.info("Pushing current branch to origin …")
    run(["git", "push"])
    await post_slack("github.push.ok")


async def refresh_working_copy() -> None:
    wc = Path(os.environ.get("WORKING_COPY_DIR", "/tmp/wc"))
    LOG.info("Refreshing working copy: %s", wc)
    run(["git", "pull"], cwd=wc)
    await deploy_to_droplet()


async def deploy_to_droplet() -> None:
    host = os.environ.get("DROPLET_SSH")
    if not host:
        LOG.warning("DROPLET_SSH not set; deployment skipped")
        return
    cmd = f"ssh {host} 'cd /srv/blackroad && git pull && npm install && pm2 restart all'"
    run(cmd, check=False)
    await post_slack("deploy.ok")


async def rebase_branch_update_site() -> None:
    LOG.info("Rebasing onto origin/main …")
    run(["git", "fetch", "origin"])
    run(["git", "rebase", "origin/main"])
    await push_latest()
    await refresh_working_copy()


async def sync_salesforce_airtable_droplet() -> None:
    LOG.info("Syncing Salesforce -> Airtable -> Droplet …")
    await CONNECTORS["salesforce"].sync()
    await CONNECTORS["airtable"].sync()
    await deploy_to_droplet()
    await post_slack("connector.sync.ok")


# Mapping of command phrases to coroutine functions
COMMANDS: Dict[str, Callable[[], Awaitable[None]]] = {
    "push latest to blackroad.io": push_latest,
    "refresh working copy and redeploy": refresh_working_copy,
    "rebase branch and update site": rebase_branch_update_site,
    "sync salesforce -> airtable -> droplet": sync_salesforce_airtable_droplet,
}


async def dispatch(text: str) -> None:
    text = text.strip().lower()
    for key, func in COMMANDS.items():
        if key in text:
            await func()
            return
    LOG.error("Unknown command: %s", text)


# ---------------------------------------------------------------------------
# CLI entry
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="BlackRoad.io sync & deploy control surface"
    )
    parser.add_argument("command", nargs="*", help="natural language command")
    args = parser.parse_args(argv)

    text = " ".join(args.command) if args.command else input("blackroad> ")
    asyncio.run(dispatch(text))


if __name__ == "__main__":
    main()
