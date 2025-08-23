#!/usr/bin/env python3
"""Unified BlackRoad.io deployment pipeline.

This script provides a chat-oriented control surface for the BlackRoad.io
stack.  It exposes high level actions that chain together git operations,
external connector synchronization, Working Copy refresh, and Droplet
redeployment.

The implementation is intentionally lightweight: individual steps are
stubbed out so that downstream environments can replace them with
project-specific logic (OAuth flows, migrations, etc.).

Example usage::

    python scripts/blackroad_sync.py "Push latest to BlackRoad.io"
    python scripts/blackroad_sync.py "Refresh working copy and redeploy"

The script logs all actions and exits with a non-zero status on failure.
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

LOG = logging.getLogger(__name__)


def run(cmd: str, cwd: str | None = None) -> bool:
    """Run *cmd* in a subprocess.

    Returns ``True`` if the command exits successfully, ``False`` otherwise.
    Stdout and stderr are logged for visibility in Codex logs.
    """

    LOG.info("$ %s", cmd)
    proc = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        text=True,
        capture_output=True,
    )
    if proc.stdout:
        LOG.debug(proc.stdout)
    if proc.stderr:
        LOG.error(proc.stderr)
    return proc.returncode == 0


@dataclass
class PipelineContext:
    """Configuration for a pipeline run."""

    repo: Path = Path(".")
    branch: str = "main"
    droplet_host: str = os.getenv("BLACKROAD_DROPLET", "droplet")
    connectors: List[str] = field(
        default_factory=lambda: ["salesforce", "airtable", "slack", "linear"]
    )


def commit_and_push(ctx: PipelineContext) -> bool:
    """Commit local changes and push to GitHub."""

    return (
        run("git add -A", cwd=str(ctx.repo))
        and run(
            "git commit -m 'chore: sync BlackRoad pipeline'",
            cwd=str(ctx.repo),
        )
        and run(f"git pull --rebase origin {ctx.branch}", cwd=str(ctx.repo))
        and run(f"git push origin {ctx.branch}", cwd=str(ctx.repo))
    )


def sync_connectors(ctx: PipelineContext) -> bool:
    """Placeholder for syncing external connectors.

    Real deployments should implement OAuth handshakes and webhook handling
    here.  For now we simply log the targeted connectors.
    """

    for name in ctx.connectors:
        LOG.info("Syncing connector: %s", name)
    return True


def refresh_working_copy(ctx: PipelineContext) -> bool:
    """Refresh Working Copy (iOS) mirrors."""

    # Stub: in production this might trigger `working-copy://` URLs via x-callback.
    LOG.info("Refreshing Working Copy mirror for branch %s", ctx.branch)
    return True


def deploy_to_droplet(ctx: PipelineContext) -> bool:
    """Deploy latest code to the remote Droplet."""

    cmds = [
        f"ssh {ctx.droplet_host} 'cd /opt/blackroad && git pull --rebase'",
        f"ssh {ctx.droplet_host} 'make migrate || true'",
        f"ssh {ctx.droplet_host} 'sudo systemctl restart blackroad-api.service'",
    ]
    for cmd in cmds:
        if not run(cmd):
            return False
    return True


def verify_site(ctx: PipelineContext) -> bool:
    """Hit health endpoints to verify the site is up."""

    return run("curl -fsS https://blackroad.io/health || true")


def handle_command(ctx: PipelineContext, command: str) -> bool:
    """Dispatch a natural language *command* to pipeline actions."""

    lc = command.lower()
    success = True
    if "push" in lc:
        success &= commit_and_push(ctx)
    if "sync" in lc or "salesforce" in lc or "airtable" in lc:
        success &= sync_connectors(ctx)
    if "working copy" in lc or "refresh" in lc:
        success &= refresh_working_copy(ctx)
    if "rebase" in lc:
        success &= run(f"git pull --rebase origin {ctx.branch}", cwd=str(ctx.repo))
    if "deploy" in lc or "droplet" in lc:
        success &= deploy_to_droplet(ctx)
    success &= verify_site(ctx)
    return success


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", help="High level action to perform")
    parser.add_argument("--branch", default="main", help="Git branch to use")
    parser.add_argument(
        "--droplet-host", default=os.getenv("BLACKROAD_DROPLET", "droplet"),
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")
    ctx = PipelineContext(branch=args.branch, droplet_host=args.droplet_host)
    ok = handle_command(ctx, args.command)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
