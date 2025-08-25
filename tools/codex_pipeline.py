#!/usr/bin/env python3
"""Codex pipeline with rollback and error handling.

This module implements a small deployment pipeline with the following stages:

* push_to_github
* deploy_to_droplet
* connector_sync
* validate_services

Each stage is executed sequentially. If a stage raises
``subprocess.CalledProcessError`` the pipeline stops and an error is logged.
Some stages trigger automatic rollback from backups in
``/var/backups/blackroad``.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict
from urllib import request

import requests
from dotenv import load_dotenv

ERROR_LOG = Path("pipeline_errors.log")
BACKUP_ROOT = Path("/var/backups/blackroad")
LATEST_BACKUP = BACKUP_ROOT / "latest"
DROPLET_BACKUP = BACKUP_ROOT / "droplet"

LOGGER = logging.getLogger(__name__)
_FILE_HANDLER = logging.FileHandler("pipeline.log")
_FILE_HANDLER.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
LOGGER.addHandler(_FILE_HANDLER)
LOGGER.setLevel(logging.INFO)

LOG_FILE = Path(__file__).resolve().parent.parent / "pipeline_validation.log"


def run(cmd: str, *, dry_run: bool = False) -> None:
    """Run a shell command and stream output."""
    LOGGER.info("[cmd] %s", cmd)
    if dry_run:
        return
    subprocess.run(cmd, shell=True, check=True)


def notify_webhook(webhook: str, payload: dict[str, object]) -> None:
    """Send a JSON payload to a webhook URL."""
    data = json.dumps(payload).encode()
    req = request.Request(webhook, data=data, headers={"Content-Type": "application/json"})
    request.urlopen(req, timeout=5)


def log_error(stage: str, exc: Exception, rollback: bool, webhook: str | None) -> None:
    """Log a pipeline error to ``ERROR_LOG`` and optionally notify a webhook."""
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
        except Exception:  # pragma: no cover - best effort logging
            pass


def rollback_from_backup() -> None:
    """Restore the working tree from the latest backup."""
    run(f"rsync -a {LATEST_BACKUP}/ ./")


# ---------------------------------------------------------------------------
# Pipeline stages


def push_to_github() -> None:
    """Push local commits to GitHub."""
    run("git push origin HEAD")


def push_latest(*, dry_run: bool = False) -> None:
    """Push local commits to GitHub (CLI helper)."""
    if dry_run:
        run("git push origin HEAD", dry_run=True)
    else:
        run("git push origin HEAD")


def refresh_working_copy(*, repo_path: str = ".", dry_run: bool = False) -> None:
    """Refresh the Working Copy mirror for this repository."""
    cmd = f"git -C {repo_path} pull --ff-only"
    if dry_run:
        run(cmd, dry_run=True)
    else:
        run(cmd)


def deploy_to_droplet(*, dry_run: bool = False) -> None:
    """Placeholder for redeploying the BlackRoad droplet."""
    if dry_run:
        run("deploy-to-droplet", dry_run=True)
    else:
        run("deploy-to-droplet")


def redeploy_droplet(*, dry_run: bool = False) -> None:
    """Placeholder for redeploying the BlackRoad droplet (CLI helper)."""
    if dry_run:
        run("redeploy-droplet", dry_run=True)
    else:
        run("redeploy-droplet")


def connector_sync() -> None:
    """Trigger external connector synchronisation."""
    run("connector-sync")


def validate_services() -> dict[str, str]:
    """Check core services and return a status summary."""

    def _check_service(name: str, url: str) -> str:
        try:
            with request.urlopen(url, timeout=5) as resp:  # nosec B310
                if resp.getcode() != 200:
                    raise ValueError(f"unexpected status {resp.getcode()}")
                payload = json.loads(resp.read().decode())
                status = "OK" if payload.get("status") == "ok" else "FAIL"
        except Exception:  # noqa: BLE001
            status = "FAIL"

        timestamp = datetime.utcnow().isoformat()
        with LOG_FILE.open("a", encoding="utf-8") as fh:
            fh.write(f"{timestamp} {name} {status}\n")
        return status

    summary = {
        "frontend": _check_service("frontend", "https://blackroad.io/health"),
        "api": _check_service("api", "http://127.0.0.1:4000/api/health"),
        "llm": _check_service("llm", "http://127.0.0.1:8000/health"),
        "math": _check_service("math", "http://127.0.0.1:8500/health"),
    }
    summary["timestamp"] = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    print(json.dumps(summary))
    return summary


# Stages executed by ``run_pipeline``
STAGES: list[Callable[[], None]] = [
    push_to_github,
    deploy_to_droplet,
    connector_sync,
    lambda: run("validate-services"),
]

# Give the stage a friendly name for logging/tests
STAGES[-1].__name__ = "validate_services"


def run_pipeline(*, force: bool = False, webhook: str | None = None) -> None:
    """Execute the deployment pipeline."""
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
            elif stage.__name__ == "validate_services":
                rollback = True
                rollback_from_backup()
            log_error(stage.__name__, exc, rollback, webhook)
            if not force:
                raise


# ---------------------------------------------------------------------------
# Connectors


def call_connectors(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Call BlackRoad's connectors API with retry and logging."""
    load_dotenv()
    token = os.getenv("CONNECTOR_KEY")
    if not token:
        raise RuntimeError("CONNECTOR_KEY missing from environment")

    logger = logging.getLogger("pipeline_connectors")
    if not logger.handlers:
        handler = logging.FileHandler("pipeline_connectors.log")
        formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    url = f"https://blackroad.io/connectors/{action}"
    headers = {"Authorization": f"Bearer {token}"}

    for attempt in range(3):
        try:
            logger.info("POST %s payload=%s", url, payload)
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            logger.info("response=%s", data)
            if data.get("ok") is True:
                return data
            logger.error("connector returned non-ok response: %s", data)
        except requests.RequestException as exc:
            logger.error("connector call failed: %s", exc)
        time.sleep(2**attempt)
    raise RuntimeError("connector call failed after retries")


def sync_connectors(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """CLI wrapper around :func:`call_connectors`."""
    return call_connectors(action, payload)


# ---------------------------------------------------------------------------
# Command line interface


def main(argv: list[str] | None = None) -> int:
    """Entry point for the codex pipeline CLI."""
    parser = argparse.ArgumentParser(
        description="BlackRoad Codex pipeline scaffold",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate actions without executing external commands",
    )
    parser.add_argument(
        "--skip-validate",
        action="store_true",
        help="Skip service health validation",
    )
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("push", help="Push latest to BlackRoad.io")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    sub.add_parser("rebase", help="Rebase branch and update site")
    sync = sub.add_parser("sync", help="Sync Salesforce → Airtable → Droplet")
    sync.add_argument("action", choices=["paste", "append", "replace", "restart", "build"])
    sync.add_argument("payload", help="JSON payload for the action")
    args = parser.parse_args(argv)

    exit_code = 0
    if args.command == "push":
        if args.dry_run:
            push_latest(dry_run=True)
            redeploy_droplet(dry_run=True)
        else:
            push_latest()
            redeploy_droplet()
    elif args.command == "refresh":
        if args.dry_run:
            push_latest(dry_run=True)
            refresh_working_copy(dry_run=True)
            redeploy_droplet(dry_run=True)
        else:
            push_latest()
            refresh_working_copy()
            redeploy_droplet()
    elif args.command == "rebase":
        if args.dry_run:
            run("git pull --rebase", dry_run=True)
            push_latest(dry_run=True)
            redeploy_droplet(dry_run=True)
        else:
            run("git pull --rebase")
            push_latest()
            redeploy_droplet()
    elif args.command == "sync":
        payload = json.loads(args.payload)
        sync_connectors(args.action, payload)
    else:
        parser.print_help()
        return exit_code

    if not args.skip_validate:
        summary = validate_services()
        if any(v != "OK" for k, v in summary.items() if k != "timestamp"):
            exit_code = 1

    return exit_code


if __name__ == "__main__":  # pragma: no cover - CLI entry
    raise SystemExit(main())
