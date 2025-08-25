"""Lightweight deployment pipeline utilities for BlackRoad.

The pipeline consists of four stages executed sequentially:

1. push_to_github – push the current branch
2. deploy_to_droplet – copy files to the production droplet
3. call_connectors – notify external connectors
4. validate_services – run a health check command

Failures in any stage are logged to ``pipeline_errors.log`` and may trigger
rollback from backups stored in ``/var/backups/blackroad``.  The module also
exposes helpers for a tiny CLI used in the tests.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import time
import traceback
from pathlib import Path
from typing import Any, Callable, Dict
from urllib import error, request

import requests


# ---------------------------------------------------------------------------
# Logging and constants
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


# ---------------------------------------------------------------------------
# Helper functions
def run(cmd: str, *, dry_run: bool = False) -> None:
    """Execute ``cmd`` in a subprocess.

    Parameters
    ----------
    cmd:
        Shell command to run.
    dry_run:
        If ``True`` the command is logged but not executed.
    """

    LOGGER.info("[cmd] %s", cmd)
    if not dry_run:
        subprocess.run(cmd, shell=True, check=True)


def notify_webhook(webhook: str, payload: Dict[str, Any]) -> None:
    """Send ``payload`` as JSON to ``webhook`` ignoring errors."""

    data = json.dumps(payload).encode()
    req = request.Request(webhook, data=data, headers={"Content-Type": "application/json"})
    request.urlopen(req, timeout=5)


def log_error(stage: str, exc: Exception, rollback: bool, webhook: str | None) -> None:
    """Record ``exc`` for ``stage`` and optionally notify a webhook."""

    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    tb = traceback.format_exc()
    with ERROR_LOG.open("a", encoding="utf-8") as fh:
        fh.write(f"{timestamp} [{stage}] {exc}\n{tb}\n")
        if rollback:
            fh.write("ROLLBACK INITIATED\n")
    if webhook:
        try:
            notify_webhook(webhook, {"stage": stage, "error": str(exc), "rollback": rollback})
        except Exception:  # pragma: no cover - best effort
            pass


def rollback_from_backup() -> None:
    """Restore the repository from the latest backup."""

    run(f"rsync -a {LATEST_BACKUP}/ ./")


# ---------------------------------------------------------------------------
# Stage implementations
def push_to_github() -> None:
    run("git push origin HEAD")


def deploy_to_droplet() -> None:
    run("deploy-to-droplet")


def _connector_stage() -> None:
    run("connector-sync")


def _validate_stage() -> None:
    run("validate-services")


# Expose stage names expected by tests
connector_stage = _connector_stage
connector_stage.__name__ = "call_connectors"
validate_stage = _validate_stage
validate_stage.__name__ = "validate_services"


STAGES: list[Callable[[], None]] = [
    push_to_github,
    deploy_to_droplet,
    connector_stage,
    validate_stage,
]


def run_pipeline(*, force: bool = False, webhook: str | None = None) -> None:
    """Execute the pipeline stages in order."""

    for stage in STAGES:
        try:
            stage()
        except subprocess.CalledProcessError as exc:
            rollback = False
            if stage is deploy_to_droplet:
                rollback = True
                run(f"rsync -a {DROPLET_BACKUP}/ /srv/blackroad/")
            elif stage is validate_stage:
                rollback = True
                rollback_from_backup()
            elif stage is push_to_github:
                run("git reset --hard")

            log_error(stage.__name__, exc, rollback, webhook)
            if not force:
                raise


# ---------------------------------------------------------------------------
# Connector API
def call_connectors(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Call BlackRoad's connectors API and return the JSON response."""

    token = os.getenv("CONNECTOR_KEY")
    if not token:
        raise RuntimeError("CONNECTOR_KEY missing from environment")

    url = f"https://blackroad.io/connectors/{action}"
    headers = {"Authorization": f"Bearer {token}"}

    LOGGER.info("POST %s payload=%s", url, payload)
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("ok") is not True:
        raise RuntimeError("connector returned non-ok response")
    return data


def sync_connectors(action: str, payload: Dict[str, Any]) -> None:
    """Wrapper used by the CLI to invoke connectors."""

    call_connectors(action, payload)


# ---------------------------------------------------------------------------
# Working Copy helpers and CLI support
def sync_to_working_copy(repo_path: str, *, dry_run: bool = False) -> None:
    """Push to a ``working-copy`` remote if configured."""

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


def push_latest(*, dry_run: bool = False) -> None:
    """Push local commits to GitHub."""

    run("git push origin HEAD", dry_run=dry_run)


def refresh_working_copy(*, repo_path: str = ".", dry_run: bool = False) -> None:
    """Refresh the Working Copy mirror for this repository."""

    sync_to_working_copy(repo_path, dry_run=dry_run)


def redeploy_droplet(*, dry_run: bool = False) -> None:
    """Placeholder redeploy action for the droplet."""

    LOGGER.info("TODO: implement droplet redeploy")
    if not dry_run:
        time.sleep(0)  # pragma: no cover - illustrative no-op


# ---------------------------------------------------------------------------
# Service validation
def _check_service(name: str, url: str) -> str:
    """Return ``OK`` if ``url`` responds with ``{"status": "ok"}``."""

    try:
        with request.urlopen(url, timeout=5) as resp:  # noqa: S310 - local request
            if resp.getcode() != 200:
                raise ValueError(f"unexpected status {resp.getcode()}")
            payload = json.loads(resp.read().decode())
            status = "OK" if payload.get("status") == "ok" else "FAIL"
    except Exception:  # noqa: BLE001 - broad for resilience
        status = "FAIL"

    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with LOG_FILE.open("a", encoding="utf-8") as fh:
        fh.write(f"{timestamp} {name} {status}\n")
    return status


def validate_services() -> Dict[str, str]:
    """Check core services and return a status summary."""

    summary = {
        "frontend": _check_service("frontend", "https://blackroad.io/health"),
        "api": _check_service("api", "http://127.0.0.1:4000/api/health"),
        "llm": _check_service("llm", "http://127.0.0.1:8000/health"),
        "math": _check_service("math", "http://127.0.0.1:8500/health"),
    }
    summary["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(json.dumps(summary))
    return summary


# ---------------------------------------------------------------------------
# CLI
def main(argv: list[str] | None = None) -> int:
    """Entry point for the small command line interface."""

    parser = argparse.ArgumentParser(description="BlackRoad Codex pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Simulate actions without executing commands")
    parser.add_argument("--skip-validate", action="store_true", help="Skip service health validation")

    sub = parser.add_subparsers(dest="command")
    sub.add_parser("push", help="Push latest to BlackRoad.io")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    sub.add_parser("rebase", help="Rebase branch and update site")
    sync = sub.add_parser("sync", help="Sync Salesforce → Airtable → Droplet")
    sync.add_argument("action", choices=["paste", "append", "replace", "restart", "build"])
    sync.add_argument("payload", help="JSON payload for the action")

    args = parser.parse_args(argv)
    exit_code = 0

    kwargs = {"dry_run": args.dry_run} if args.dry_run else {}

    if args.command == "push":
        push_latest(**kwargs)
        redeploy_droplet(**kwargs)
    elif args.command == "refresh":
        push_latest(**kwargs)
        refresh_working_copy(**kwargs)
        redeploy_droplet(**kwargs)
    elif args.command == "rebase":
        run("git pull --rebase", dry_run=args.dry_run)
        push_latest(**kwargs)
        redeploy_droplet(**kwargs)
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


if __name__ == "__main__":
    raise SystemExit(main())

