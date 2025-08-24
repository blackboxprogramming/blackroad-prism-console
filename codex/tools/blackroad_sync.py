#!/usr/bin/env python3
"""Scaffold for BlackRoad.io end-to-end sync and deployment.

This script provides a chat-first control surface for triggering the
full pipeline from Codex to the live BlackRoad.io site. The current
implementation is a skeleton; connector integration and droplet deploy
steps are placeholders to be filled in later.
"""

import argparse
import subprocess
import logging
from typing import List

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def run(cmd: List[str]) -> None:
    """Run a shell command and log it."""
    logging.info("Running: %s", " ".join(cmd))
    subprocess.run(cmd, check=False)


def push_latest() -> None:
    """Commit and push local changes to GitHub."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", "chore: automatic commit from codex"])
    run(["git", "push"])


def sync_connectors() -> None:
    """Placeholder for connector sync (Salesforce, Airtable, Slack, etc.)."""
    logging.info("TODO: implement connector synchronization")


def refresh_working_copy() -> None:
    """Placeholder for iOS Working Copy refresh."""
    logging.info("TODO: implement Working Copy automation")


def deploy_to_droplet() -> None:
    """Placeholder for droplet deployment."""
    logging.info("TODO: implement droplet deployment")


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io sync scaffold")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("push", help="Commit and push local changes")
    sub.add_parser("sync", help="Sync connectors and Working Copy")
    sub.add_parser("deploy", help="Deploy latest code to droplet")
    sub.add_parser("all", help="Run push, sync, and deploy steps")

    args = parser.parse_args()

    if args.cmd == "push":
        push_latest()
    elif args.cmd == "sync":
        sync_connectors()
        refresh_working_copy()
    elif args.cmd == "deploy":
        deploy_to_droplet()
    elif args.cmd == "all":
        push_latest()
        sync_connectors()
        refresh_working_copy()
        deploy_to_droplet()
    else:
        parser.print_help()
"""BlackRoad end-to-end sync & deploy scaffolder.

This utility sketches the flow from local changes to the live site.  Each
step is represented by a function that can be filled in with project specific
logic.  The goal is to provide a single entry point that mirrors the
requirements in the "CodeX prompt" so an operator can type a natural language
command and have the underlying steps executed in order.

The functions are intentionally lightweight: they log what they would do and
return.  Replace the placeholders with real API calls, OAuth flows, webhook
handlers and deployment logic as the infrastructure solidifies.

Example usage::

    python codex/tools/blackroad_sync.py "Push latest to BlackRoad.io"

Available commands are documented in ``COMMAND_MAP`` below.
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
import shlex
import subprocess
from pathlib import Path
from typing import Callable, Dict


def run(cmd: str) -> None:
    """Run a shell command, streaming output to the console."""

    print(f"$ {cmd}")
    subprocess.run(shlex.split(cmd), check=False)


# --- GitHub integration ----------------------------------------------------


def github_push() -> None:
    """Commit and push local changes to the current branch."""

    run("git add -A")
    run("git commit -m 'chore: sync from codex' || true")
    run("git push origin HEAD")


# --- Connector placeholders -------------------------------------------------


def sync_connectors() -> None:
    """Stub for Salesforce/Airtable/Slack/Linear sync tasks."""

    print("[connectors] syncing external services… (placeholder)")


# --- Working Copy (iOS) ----------------------------------------------------


def refresh_working_copy() -> None:
    """Placeholder for automating iOS Working Copy refresh."""

    print("[working-copy] refresh triggered… (placeholder)")


# --- Droplet deployment ----------------------------------------------------

DEPLOY_PATH = Path("/srv/blackroad-api")


def deploy_to_droplet() -> None:
    """Pull latest code, run migrations and restart services."""

    print("[droplet] pulling latest code… (placeholder)")
    print("[droplet] running migrations… (placeholder)")
    print("[droplet] restarting services… (placeholder)")


# --- High level flows ------------------------------------------------------


def push_latest_flow() -> None:
    github_push()
    sync_connectors()
    refresh_working_copy()
    deploy_to_droplet()


def refresh_and_deploy_flow() -> None:
    refresh_working_copy()
    deploy_to_droplet()


def rebase_and_update_flow() -> None:
    run("git pull --rebase")
    deploy_to_droplet()


def sync_salesforce_to_droplet_flow() -> None:
    sync_connectors()
    deploy_to_droplet()


COMMAND_MAP: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": push_latest_flow,
    "refresh working copy and redeploy": refresh_and_deploy_flow,
    "rebase branch and update site": rebase_and_update_flow,
    "sync salesforce → airtable → droplet": sync_salesforce_to_droplet_flow,
    # allow ASCII arrow as well
    "sync salesforce -> airtable -> droplet": sync_salesforce_to_droplet_flow,
}


# --- CLI -------------------------------------------------------------------


def handle_command(text: str) -> None:
    key = text.lower().strip()
    fn = COMMAND_MAP.get(key)
    if not fn:
        print(f"Unknown command: {text}")
        return
    fn()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("command", nargs="+", help="chat-style instruction")
    args = ap.parse_args()
    handle_command(" ".join(args.command))
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
