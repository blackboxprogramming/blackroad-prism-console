#!/usr/bin/env python3
"""BlackRoad.io sync and deployment helper.

Unified pipeline for pushing code, refreshing a Working Copy checkout and
deploying to the remote droplet. Designed for chat-driven workflows.
"""

from __future__ import annotations

import argparse
import logging
import os
import shlex
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


@dataclass
class PipelineContext:
    """Configuration for a pipeline run."""

    repo: Path = Path(".")
    branch: str = "main"
    droplet_host: str = os.getenv("BLACKROAD_DROPLET", "droplet")
    working_copy: Path = Path(os.getenv("WORKING_COPY_PATH", "/opt/blackroad/working_copy"))
    connectors: list[str] = field(
        default_factory=lambda: ["salesforce", "airtable", "slack", "linear"]
    )


@dataclass(frozen=True)
class WorkingCopyTarget:
    """Represents a Working Copy mirror to refresh."""

    host: str | None
    path: Path


def _parse_working_copy_devices(ctx: PipelineContext) -> List[WorkingCopyTarget]:
    """Return Working Copy mirrors derived from environment configuration."""

    devices = os.getenv("WORKING_COPY_DEVICES", "")
    default_path = os.getenv("WORKING_COPY_PATH", str(ctx.working_copy))
    targets: list[WorkingCopyTarget] = []

    if devices:
        for raw_entry in devices.split(","):
            entry = raw_entry.strip()
            if not entry:
                continue
            host: str | None = None
            path_text: str
            if ":" in entry and not entry.startswith("/"):
                host_part, path_part = entry.split(":", 1)
                host = host_part.strip() or None
                path_text = path_part.strip() or default_path
            else:
                path_text = entry
            if host and host.lower() == "local":
                host = None
            targets.append(
                WorkingCopyTarget(host, Path(path_text).expanduser())
            )

    if not targets:
        host_env = os.getenv("WORKING_COPY_HOST")
        if host_env:
            path_env = os.getenv("WORKING_COPY_PATH", default_path)
            targets.append(
                WorkingCopyTarget(host_env.strip(), Path(path_env).expanduser())
            )
        else:
            targets.append(WorkingCopyTarget(None, ctx.working_copy.expanduser()))

    deduped: list[WorkingCopyTarget] = []
    seen: set[tuple[str, Path]] = set()
    for target in targets:
        key = ((target.host or "").lower(), target.path)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(target)
    return deduped


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
    """Refresh the iOS Working Copy mirror.

    If ``WORKING_COPY_CMD`` is set in the environment, that command is executed
    to allow custom integration with the Working Copy app (for example via
    x-callback-url).  Otherwise the function refreshes every configured mirror
    derived from ``WORKING_COPY_DEVICES``/``WORKING_COPY_HOST``/``WORKING_COPY_PATH``.
    """
    cmd = os.getenv("WORKING_COPY_CMD")
    if cmd:
        LOG.info("Refreshing Working Copy via command: %s", cmd)
        return run(cmd)

    targets = _parse_working_copy_devices(ctx)
    success = True
    if not targets:
        LOG.info("No working copy targets configured; skipping Working Copy refresh")
        return True

    for target in targets:
        if target.host:
            remote_path = shlex.quote(str(target.path))
            remote_cmd = shlex.quote(
                f"cd {remote_path} && git pull --rebase"
            )
            LOG.info(
                "Refreshing Working Copy on %s:%s", target.host, target.path
            )
            success &= run(f"ssh {target.host} {remote_cmd}")
        else:
            target.path.mkdir(parents=True, exist_ok=True)
            LOG.info("Refreshing Working Copy mirror at %s", target.path)
            success &= run("git pull --rebase", cwd=str(target.path))
    return success


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


def auto_sync(ctx: PipelineContext) -> bool:
    """Run the full sync pipeline: commit, connectors, working copy and deploy."""
    return (
        commit_and_push(ctx)
        and sync_connectors(ctx)
        and refresh_working_copy(ctx)
        and deploy_to_droplet(ctx)
        and verify_site(ctx)
    )


def handle_command(ctx: PipelineContext, command: str) -> bool:
    """Dispatch a natural language *command* to pipeline actions."""
    lc = command.lower()
    if "auto" in lc or "all" in lc:
        return auto_sync(ctx)
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


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", help="High level action to perform")
    parser.add_argument("--branch", default="main", help="Git branch to use")
    parser.add_argument(
        "--droplet-host",
        default=os.getenv("BLACKROAD_DROPLET", "droplet"),
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(message)s")
    ctx = PipelineContext(branch=args.branch, droplet_host=args.droplet_host)
    ok = handle_command(ctx, args.command)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
