#!/usr/bin/env python3
"""Codex deployment pipeline with rollback and error handling.

This module provides a small deployment pipeline made of four stages:

* ``push_to_github``
* ``deploy_to_droplet``
* ``run_connector_sync``
* ``run_validate_services``

Each stage is executed in order and wrapped with error handling.  Failures are
logged to ``pipeline_errors.log`` and the pipeline stops unless ``--force`` is
supplied.  Some failures trigger automatic rollback from the latest backup
located in ``/var/backups/blackroad``.
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
LOG_FILE = Path(__file__).resolve().parent.parent / "pipeline_validation.log"


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
    request.urlopen(req, timeout=5)  # noqa: S310


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
        except Exception:  # pragma: no cover - best effort logging
            pass


def rollback_from_backup() -> None:
    run(f"rsync -a {LATEST_BACKUP}/ ./")


def push_to_github() -> None:
    run("git push origin HEAD")


def push_latest(*, dry_run: bool = False) -> None:
    """Push local commits to GitHub."""
    run("git push origin HEAD", dry_run=dry_run)


def sync_to_working_copy(repo_path: str, *, dry_run: bool = False) -> None:
    """Ensure the repo is up to date in the Working Copy app."""
    LOGGER.info("sync_to_working_copy repo_path=%s", repo_path)
    try:
        result = subprocess.run(
            ["git", "-C", repo_path, "remote"],
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as exc:  # pragma: no cover - defensive
        LOGGER.error("git remote failed: %s", exc)
        return

    if "working-copy" not in result.stdout:
        LOGGER.info("No Working Copy remote configured; skipping sync")
        return

    run(f"git -C {repo_path} push working-copy HEAD", dry_run=dry_run)


def refresh_working_copy(*, repo_path: str = ".", dry_run: bool = False) -> None:
    """Refresh the Working Copy mirror for this repository."""
    sync_to_working_copy(repo_path, dry_run=dry_run)


def deploy_to_droplet() -> None:
    run("deploy-to-droplet")


def run_connector_sync() -> None:
    """Stage step which synchronises external connectors."""
    run("connector-sync")


def run_validate_services() -> None:
    """Stage step which validates running services."""
    run("validate-services")


STAGES: list[Callable[[], None]] = [
    push_to_github,
    deploy_to_droplet,
    run_connector_sync,
    run_validate_services,
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
            elif stage is run_validate_services:
                rollback = True
                rollback_from_backup()
            log_error(stage.__name__, exc, rollback, webhook)
            if not force:
                raise


def redeploy_droplet(*, dry_run: bool = False) -> None:
    """Placeholder for redeploying the BlackRoad droplet."""
    LOGGER.info("TODO: implement droplet redeploy")


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
        except requests.RequestException as exc:  # pragma: no cover - network call
            logger.error("connector call failed: %s", exc)
        time.sleep(2**attempt)
    raise RuntimeError("connector call failed after retries")


def sync_connectors(action: str, payload: Dict[str, Any]) -> None:
    """Sync external connectors via Prism API."""
    call_connectors(action, payload)


def _check_service(name: str, url: str) -> str:
    """Return ``OK`` if the service responds with ``{"status": "ok"}``."""
    try:
        with request.urlopen(url, timeout=5) as resp:  # noqa: S310
            if resp.getcode() != 200:
                raise ValueError(f"unexpected status {resp.getcode()}")
            payload = json.loads(resp.read().decode())
            status = "OK" if payload.get("status") == "ok" else "FAIL"
    except Exception:  # noqa: BLE001 - broad for resilience
        status = "FAIL"

    timestamp = datetime.utcnow().isoformat()
    with LOG_FILE.open("a", encoding="utf-8") as fh:
        fh.write(f"{timestamp} {name} {status}\n")
    return status


def validate_services() -> dict[str, str]:
    """Check core services and return a status summary."""
    summary = {
        "frontend": _check_service("frontend", "https://blackroad.io/health"),
        "api": _check_service("api", "http://127.0.0.1:4000/api/health"),
        "llm": _check_service("llm", "http://127.0.0.1:8000/health"),
        "math": _check_service("math", "http://127.0.0.1:8500/health"),
    }
    summary["timestamp"] = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    print(json.dumps(summary))
    return summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="BlackRoad Codex pipeline")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate actions without executing external commands",
    )
    parser.add_argument(
        "--skip-validate", action="store_true", help="Skip service health validation"
    )
    parser.add_argument("--force", action="store_true", help="continue even if a step fails")
    parser.add_argument("--webhook", help="Webhook URL for error notifications")
    sub = parser.add_subparsers(dest="command")
    sub.add_parser("push", help="Push latest to BlackRoad.io")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    sub.add_parser("rebase", help="Rebase branch and update site")
    sync = sub.add_parser("sync", help="Sync Salesforce → Airtable → Droplet")
    sync.add_argument("action", choices=["paste", "append", "replace", "restart", "build"])
    sync.add_argument("payload", help="JSON payload for the action")
    args = parser.parse_args(argv)

    try:
        run_pipeline(force=args.force, webhook=args.webhook)
    except subprocess.CalledProcessError:
        return 1

    if args.command == "push":
        push_latest(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "refresh":
        push_latest(dry_run=args.dry_run)
        refresh_working_copy(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "rebase":
        run("git pull --rebase", dry_run=args.dry_run)
        push_latest(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "sync":
        payload = json.loads(args.payload)
        sync_connectors(args.action, payload)
    else:
        parser.print_help()
        return 0

    if not args.skip_validate:
        summary = validate_services()
        if any(v != "OK" for k, v in summary.items() if k != "timestamp"):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
