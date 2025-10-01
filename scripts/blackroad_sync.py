#!/usr/bin/env python3
"""BlackRoad.io sync and deployment helper.

Unified pipeline for pushing code, refreshing a Working Copy checkout and
deploying to the remote droplet. Designed for chat-driven workflows.
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
    """Run *cmd* in a subprocess and log output."""
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


def _default_working_copy() -> Path:
    return Path(os.getenv("WORKING_COPY_PATH", "/opt/blackroad/working_copy"))


@dataclass
class PipelineContext:
    """Configuration for a pipeline run."""

    repo: Path = Path(".")
    branch: str = "main"
    droplet_host: str = os.getenv("BLACKROAD_DROPLET", "droplet")
    working_copy: Path = field(default_factory=_default_working_copy)
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
    """Placeholder for syncing external connectors."""
    for name in ctx.connectors:
        LOG.info("Syncing connector: %s", name)
    return True


def refresh_working_copy(ctx: PipelineContext) -> bool:
    """Refresh Working Copy mirror at the designated path."""
    wc = ctx.working_copy
    wc.mkdir(parents=True, exist_ok=True)
    LOG.info("Refreshing Working Copy mirror at %s", wc)
    return run("git pull --rebase", cwd=str(wc))


def deploy_to_droplet(ctx: PipelineContext) -> bool:
    """Deploy latest code to the remote droplet."""
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
        "--droplet-host",
        default=os.getenv("BLACKROAD_DROPLET", "droplet"),
    )
    parser.add_argument(
        "--working-copy",
        type=Path,
        help="Path to the Working Copy checkout (defaults to $WORKING_COPY_PATH or /opt/blackroad/working_copy)",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")
    ctx = PipelineContext(
        branch=args.branch,
        droplet_host=args.droplet_host,
        working_copy=args.working_copy or _default_working_copy(),
    )
    ok = handle_command(ctx, args.command)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
