#!/usr/bin/env python3
"""Codex pipeline with rollback and error handling.

This script runs a minimal deployment pipeline consisting of four stages:

* push_to_github
* deploy_to_droplet
* call_connectors
* validate_services

Each stage logs console output to ``pipeline.log`` and records failures in
``pipeline_errors.log``. When a stage fails the pipeline stops unless the
``--force`` flag is used. Some failures trigger automatic rollback from the
latest backup located in ``/var/backups/blackroad``.
"""

from __future__ import annotations

import argparse
import json
import logging
import subprocess
import traceback
from datetime import datetime
from pathlib import Path
from typing import Callable
from urllib import request

ERROR_LOG = Path("pipeline_errors.log")
BACKUP_ROOT = Path("/var/backups/blackroad")
LATEST_BACKUP = BACKUP_ROOT / "latest"
DROPLET_BACKUP = BACKUP_ROOT / "droplet"

LOGGER = logging.getLogger(__name__)
_FILE_HANDLER = logging.FileHandler("pipeline.log")
_FILE_HANDLER.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
LOGGER.addHandler(_FILE_HANDLER)
LOGGER.setLevel(logging.INFO)

def run(cmd: str, *, dry_run: bool = False) -> None:
    """Run a shell command and stream output."""
    LOGGER.info("[cmd] %s", cmd)
    if dry_run:
        return
    subprocess.run(cmd, shell=True, check=True)


def notify_webhook(webhook: str, payload: dict[str, object]) -> None:
    data = json.dumps(payload).encode()
    req = request.Request(webhook, data=data, headers={"Content-Type": "application/json"})
    request.urlopen(req, timeout=5)


def log_error(stage: str, exc: Exception, rollback: bool, webhook: str | None) -> None:
    timestamp = datetime.utcnow().isoformat()
    tb = traceback.format_exc()
    with ERROR_LOG.open("a", encoding="utf-8") as fh:
        fh.write(f"{timestamp} [{stage}] {exc}\n{tb}\n")
        if rollback:
            fh.write("ROLLBACK INITIATED\n")
    if webhook:
        payload = {"stage": stage, "error": str(exc), "rollback": rollback}
        try:
            notify_webhook(webhook, payload)
        except Exception:
            pass


def rollback_from_backup() -> None:
    run(f"rsync -a {LATEST_BACKUP}/ ./")


def push_to_github() -> None:
    run("git push origin HEAD")

def deploy_to_droplet() -> None:
    """Deploy the application to the droplet."""
    run("deploy-to-droplet")


def call_connectors() -> None:
    run("connector-sync")


def validate_services() -> None:
    run("validate-services")


STAGES: list[Callable[[], None]] = [
    push_to_github,
    deploy_to_droplet,
    call_connectors,
    validate_services,
]


def run_pipeline(*, force: bool = False, webhook: str | None = None) -> None:
    for stage in STAGES:
        try:
            stage()
        except subprocess.CalledProcessError as exc:
            rollback = False
            if stage is push_to_github:
                run("git reset --hard")
            elif stage is deploy_to_droplet:
                rollback = True
                run(f"rsync -a {DROPLET_BACKUP}/ /srv/blackroad/")
            elif stage is validate_services:
                rollback = True
                rollback_from_backup()
            log_error(stage.__name__, exc, rollback, webhook)
            if not force:
                raise


def main(argv: list[str] | None = None) -> int:
    """Minimal CLI wrapper for running the pipeline."""
    parser = argparse.ArgumentParser(description="BlackRoad Codex pipeline")
    parser.add_argument("--force", action="store_true", help="continue even if a step fails")
    parser.add_argument("--webhook", help="Webhook URL for error notifications")
    args = parser.parse_args(argv)
    try:
        run_pipeline(force=args.force, webhook=args.webhook)
    except subprocess.CalledProcessError:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
