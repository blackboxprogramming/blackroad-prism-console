from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable
from urllib import request

import requests
from dotenv import load_dotenv

# Logging setup
LOGGER = logging.getLogger(__name__)
LOGGER.addHandler(logging.StreamHandler())
LOGGER.setLevel(logging.INFO)

ERROR_LOG = Path("pipeline_errors.log")
BACKUP_ROOT = Path("/var/backups/blackroad")
LATEST_BACKUP = BACKUP_ROOT / "latest"
DROPLET_BACKUP = BACKUP_ROOT / "droplet"
LOG_FILE = Path(__file__).resolve().parent.parent / "pipeline_validation.log"


def run(cmd: str) -> None:
    """Run a shell command and stream output."""
    LOGGER.info("[cmd] %s", cmd)
    subprocess.run(cmd, shell=True, check=True)


def notify_webhook(webhook: str, payload: dict[str, object]) -> None:
    data = json.dumps(payload).encode()
    req = request.Request(webhook, data=data, headers={"Content-Type": "application/json"})
    request.urlopen(req, timeout=5)


def log_error(stage: str, exc: Exception, rollback: bool, webhook: str | None) -> None:
    timestamp = datetime.utcnow().isoformat()
    with ERROR_LOG.open("a", encoding="utf-8") as fh:
        fh.write(f"{timestamp} [{stage}] {exc}\n")
        if rollback:
            fh.write("ROLLBACK INITIATED\n")
    if webhook:
        try:  # pragma: no cover - best effort notification
            notify_webhook(webhook, {"stage": stage, "error": str(exc), "rollback": rollback})
        except Exception:  # noqa: BLE001
            pass


def rollback_from_backup() -> None:
    run(f"rsync -a {LATEST_BACKUP}/ ./")


def push_to_github(*, dry_run: bool = False) -> None:
    if dry_run:
        return
    run("git push origin HEAD")


def push_latest(*, dry_run: bool = False) -> None:
    push_to_github(dry_run=dry_run)


def deploy_to_droplet(*, dry_run: bool = False) -> None:
    if dry_run:
        return
    run("deploy-to-droplet")


def sync_connectors(*, dry_run: bool = False) -> None:
    if dry_run:
        return
    run("connector-sync")


def validate_services() -> dict[str, str]:
    """Check core services and return a status summary."""

    def _check(name: str, url: str) -> str:
        try:
            with request.urlopen(url, timeout=5) as resp:  # noqa: S310 - integration check
                if resp.getcode() != 200:
                    raise ValueError("bad status")
                payload = json.loads(resp.read().decode())
                status = "OK" if payload.get("status") == "ok" else "FAIL"
        except Exception:  # noqa: BLE001
            status = "FAIL"
        ts = datetime.utcnow().isoformat()
        with LOG_FILE.open("a", encoding="utf-8") as fh:
            fh.write(f"{ts} {name} {status}\n")
        return status

    summary = {
        "frontend": _check("frontend", "https://blackroad.io/health"),
        "api": _check("api", "http://127.0.0.1:4000/api/health"),
        "llm": _check("llm", "http://127.0.0.1:8000/health"),
        "math": _check("math", "http://127.0.0.1:8500/health"),
    }
    summary["timestamp"] = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    print(json.dumps(summary))
    return summary


def validate_services_stage() -> None:
    run("validate-services")


validate_services_stage.__name__ = "validate_services"


STAGES: list[Callable[[], None]] = [
    push_to_github,
    deploy_to_droplet,
    sync_connectors,
    validate_services_stage,
]


def run_pipeline(*, force: bool = False, webhook: str | None = None) -> None:
    """Execute pipeline stages with rollback on failure."""
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


def call_connectors(action: str, payload: dict[str, Any]) -> dict[str, Any]:
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


def refresh_working_copy(*, dry_run: bool = False) -> None:
    if dry_run:
        return
    run("refresh-working-copy")


def redeploy_droplet(*, dry_run: bool = False) -> None:
    deploy_to_droplet(dry_run=dry_run)


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
        push_latest(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "refresh":
        push_latest(dry_run=args.dry_run)
        refresh_working_copy(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "rebase":
        if not args.dry_run:
            run("git pull --rebase")
        push_latest(dry_run=args.dry_run)
        redeploy_droplet(dry_run=args.dry_run)
    elif args.command == "sync":
        payload = json.loads(args.payload)
        call_connectors(args.action, payload)
    else:
        parser.print_help()
        return exit_code

    if not args.skip_validate:
        summary = validate_services()
        if any(v != "OK" for k, v in summary.items() if k != "timestamp"):
            exit_code = 1

    return exit_code


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
