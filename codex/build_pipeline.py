"""Unified Codex build script for BlackRoad.io CI/CD and sync tasks.

This module exposes a small command line interface that mirrors the
chat-first control surface described in the CODEX prompt.  Each function
invokes underlying shell commands (git, rsync, etc.) and can be chained
together by higher-level agents.

The functions are stubs: they provide the shape of the orchestration
pipeline but do not implement provider specific OAuth flows.  Operators
should fill in secrets and deployment commands appropriate for their
environment.
"""
from __future__ import annotations

from dataclasses import dataclass
import argparse
import logging
import os
import subprocess
from typing import Iterable

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


def _run(cmd: Iterable[str], check: bool = True) -> int:
    """Run a shell command and return its exit code.

    Args:
        cmd: Sequence to pass to ``subprocess.run``.
        check: When ``True`` raise ``RuntimeError`` on non-zero exit code.
    """
    logging.info("$ %s", " ".join(cmd))
    proc = subprocess.run(cmd)
    if check and proc.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(cmd)}")
    return proc.returncode


@dataclass
class Pipeline:
    """Orchestrates BlackRoad.io sync and deploy operations."""

    repo: str = os.environ.get("BLACKROAD_REPO", "blackboxprogramming/blackroad")
    working_copy: str = os.environ.get("WORKING_COPY", "~/BlackRoad")
    droplet_host: str = os.environ.get("DROPLET_HOST", "droplet")

    def push_latest(self) -> None:
        """Commit any local changes and push to the configured repo."""
        _run(["git", "add", "-A"], check=False)
        _run(["git", "commit", "-m", "Automated commit"], check=False)
        _run(["git", "push", "origin", "HEAD"])

    def refresh_working_copy(self) -> None:
        """Ensure the iOS Working Copy mirror is up to date."""
        _run(["sh", "-c", f"cd {self.working_copy} && git pull --rebase"], check=False)

    def redeploy_droplet(self) -> None:
        """Pull latest code on the droplet and restart services."""
        ssh_cmd = (
            f"ssh {self.droplet_host} 'cd /srv/blackroad && git pull --rebase && "
            "./deploy.sh'"
        )
        _run(["sh", "-c", ssh_cmd])

    def sync_connectors(self) -> None:
        """Placeholder for Salesforce/Airtable/Slack integrations."""
        logging.info("Connector sync is a stub. Implement OAuth + webhooks here.")


COMMANDS = {
    "push": Pipeline.push_latest,
    "refresh": Pipeline.refresh_working_copy,
    "deploy": Pipeline.redeploy_droplet,
    "sync": Pipeline.sync_connectors,
}


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=COMMANDS.keys())
    args = parser.parse_args(argv)

    pipeline = Pipeline()
    COMMANDS[args.command](pipeline)
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
