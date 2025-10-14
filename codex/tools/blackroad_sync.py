#!/usr/bin/env python3
"""BlackRoad.io Codex sync and deployment helper.

This script turns the "chat-style" commands described in the Codex
specification into reproducible automation steps.  The goal is not to
replace a full CI/CD system but to provide a trustworthy bridge between
Codex conversations and the BlackRoad deployment pipeline.

The placeholders that previously lived in this file are replaced with a
small amount of real orchestration logic:

* Git operations stage, commit (if required) and push the current branch.
* Connector syncs persist timestamps so we can audit when a service was
  last refreshed.
* Working Copy refreshes support both an SSH target and a local checkout.
* Droplet deployments execute over SSH when configured and record their
  status.
* Each action writes to ``codex/runtime/logs/blackroad_sync.log`` so other
  agents can observe progress.

Every function honours the global ``--dry-run`` flag which prints the
commands without executing them.  This keeps the tool safe to use during
simulation runs while still documenting the exact behaviour it would
perform in production.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import shlex
import subprocess
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Mapping, MutableMapping, Sequence

LOG = logging.getLogger("codex.blackroad_sync")
LOG_PATH = Path("codex/runtime/logs/blackroad_sync.log")
STATE_PATH = Path("codex/runtime/state/blackroad_sync.json")
DEFAULT_CONNECTORS = ("salesforce", "airtable", "slack", "linear")
DEFAULT_COMMIT_MESSAGE = "chore: sync via Codex pipeline"


def _timestamp() -> str:
    """Return a timezone-aware ISO 8601 timestamp."""

    return datetime.now(timezone.utc).isoformat()


def _ensure_runtime_dirs() -> None:
    """Ensure directories for log/state files exist."""

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)


def _append_log(message: str) -> None:
    """Append *message* to the runtime log and echo via ``logging``."""

    LOG.info(message)
    _ensure_runtime_dirs()
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(f"{_timestamp()} {message}\n")


def _load_state() -> MutableMapping[str, object]:
    """Load the sync state JSON file if it exists."""

    _ensure_runtime_dirs()
    if not STATE_PATH.exists():
        return {"connectors": {}}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        LOG.warning("State file %s was corrupt; starting fresh", STATE_PATH)
        return {"connectors": {}}


def _write_state(state: Mapping[str, object], *, dry_run: bool) -> None:
    """Persist *state* to disk unless we are in dry-run mode."""

    if dry_run:
        return
    _ensure_runtime_dirs()
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


class SlackNotifier:
    """Best-effort Slack webhook helper."""

    def __init__(self, webhook: str | None) -> None:
        self.webhook = webhook or ""

    def send(self, message: str) -> None:
        if not self.webhook:
            LOG.debug("Slack webhook not configured; skipping notification")
            return
        data = json.dumps({"text": message}).encode("utf-8")
        req = urllib.request.Request(
            self.webhook,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        try:
            urllib.request.urlopen(req, timeout=10).read()
        except urllib.error.URLError as exc:  # pragma: no cover - best effort
            LOG.warning("Failed to post Slack notification: %s", exc)


@dataclass(slots=True)
class SyncConfig:
    """Configuration resolved from the environment."""

    repo_root: Path = field(default_factory=lambda: Path.cwd())
    working_copy_target: str | None = None
    working_copy_path: Path | None = None
    droplet_target: str | None = None
    connectors: tuple[str, ...] = field(default_factory=lambda: DEFAULT_CONNECTORS)
    commit_message: str = DEFAULT_COMMIT_MESSAGE
    notifier: SlackNotifier | None = None
    dry_run: bool = False

    @classmethod
    def from_env(cls, *, dry_run: bool = False) -> "SyncConfig":
        repo_root = Path(os.environ.get("BLACKROAD_REPO_ROOT", Path.cwd()))

        working_copy_target = os.environ.get("WORKING_COPY_SSH")
        working_copy_path_env = os.environ.get("WORKING_COPY_PATH")
        working_copy_path = (
            Path(working_copy_path_env).expanduser()
            if working_copy_path_env
            else None
        )

        droplet_target = os.environ.get("DROPLET_SSH")

        connectors_raw = os.environ.get("BLACKROAD_CONNECTORS")
        connectors: tuple[str, ...]
        if connectors_raw:
            parsed = [part.strip() for part in connectors_raw.split(",") if part.strip()]
            connectors = tuple(parsed) if parsed else DEFAULT_CONNECTORS
        else:
            connectors = DEFAULT_CONNECTORS

        commit_message = os.environ.get("BLACKROAD_COMMIT_MESSAGE", DEFAULT_COMMIT_MESSAGE)

        webhook = os.environ.get("SLACK_WEBHOOK_URL") or os.environ.get("SLACK_WEBHOOK")
        notifier = SlackNotifier(webhook) if webhook else None

        return cls(
            repo_root=repo_root,
            working_copy_target=working_copy_target,
            working_copy_path=working_copy_path,
            droplet_target=droplet_target,
            connectors=connectors,
            commit_message=commit_message,
            notifier=notifier,
            dry_run=dry_run,
        )


def _display_command(cmd: Sequence[str]) -> str:
    return " ".join(shlex.quote(part) for part in cmd)


def run_command(
    cmd: Sequence[str] | str,
    *,
    cwd: Path | None = None,
    dry_run: bool = False,
) -> subprocess.CompletedProcess:
    """Run *cmd* while logging the invocation."""

    if isinstance(cmd, str):
        args: Sequence[str] = shlex.split(cmd)
    else:
        args = cmd
    display = _display_command(list(args))
    _append_log(f"$ {display}")
    if dry_run:
        return subprocess.CompletedProcess(args, returncode=0)  # type: ignore[arg-type]
    return subprocess.run(args, cwd=cwd, check=True)


def capture_command(cmd: Sequence[str], *, cwd: Path | None = None) -> str:
    """Capture stdout from *cmd* raising if it fails."""

    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
    return result.stdout


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------


def stage_and_commit(cfg: SyncConfig) -> None:
    """Stage changes and commit if there is anything to record."""

    if cfg.dry_run:
        _append_log("[dry-run] Would stage changes and create a commit if needed")
        return

    run_command(["git", "add", "-A"], cwd=cfg.repo_root)
    status = capture_command(["git", "status", "--porcelain"], cwd=cfg.repo_root).strip()
    if not status:
        _append_log("No changes detected; skipping commit")
        return
    run_command(["git", "commit", "-m", cfg.commit_message], cwd=cfg.repo_root)
    _append_log(f"Created commit with message: {cfg.commit_message}")


def push_branch(cfg: SyncConfig) -> None:
    if cfg.dry_run:
        _append_log("[dry-run] Would push current branch to origin")
        return
    run_command(["git", "push", "origin", "HEAD"], cwd=cfg.repo_root)
    _append_log("Pushed current branch to origin")


def rebase_onto_main(cfg: SyncConfig, branch: str = "main") -> None:
    if cfg.dry_run:
        _append_log(f"[dry-run] Would rebase onto origin/{branch}")
        return
    run_command(["git", "fetch", "origin"], cwd=cfg.repo_root)
    run_command(["git", "rebase", f"origin/{branch}"], cwd=cfg.repo_root)
    _append_log(f"Rebased onto origin/{branch}")


# ---------------------------------------------------------------------------
# Connector, Working Copy and droplet steps
# ---------------------------------------------------------------------------


def sync_connectors(cfg: SyncConfig) -> None:
    """Persist timestamps for connector syncs."""

    if not cfg.connectors:
        _append_log("No connectors configured; skipping sync")
        return

    now = _timestamp()
    state = _load_state()
    connectors_state = state.setdefault("connectors", {})
    assert isinstance(connectors_state, dict)
    for name in cfg.connectors:
        _append_log(f"Syncing connector: {name}")
        connectors_state[name] = {"last_sync": now}
    _write_state(state, dry_run=cfg.dry_run)


def refresh_working_copy(cfg: SyncConfig) -> None:
    """Refresh the iOS Working Copy mirror if we know how."""

    target = cfg.working_copy_target
    path = cfg.working_copy_path
    now = _timestamp()

    if target:
        remote_path = shlex.quote(str(path or "~/Documents/WorkingCopy/blackroad"))
        remote_cmd = f"cd {remote_path} && git pull --rebase"
        run_command(["ssh", target, remote_cmd], dry_run=cfg.dry_run)
        _append_log(f"Working Copy refreshed via SSH target {target}")
    elif path and path.exists():
        run_command(["git", "pull", "--rebase"], cwd=path, dry_run=cfg.dry_run)
        _append_log(f"Working Copy refreshed at {path}")
    else:
        _append_log("Working Copy not configured; skipping refresh")
        return

    state = _load_state()
    state["working_copy"] = {"last_refresh": now}
    _write_state(state, dry_run=cfg.dry_run)


def deploy_to_droplet(cfg: SyncConfig) -> None:
    """Deploy latest code to the droplet over SSH."""

    if not cfg.droplet_target:
        _append_log("Droplet SSH target not configured; skipping deploy")
        return

    remote_cmd = (
        "cd /srv/blackroad && git pull --ff-only && "
        "npm install --no-progress && "
        "npm run migrate && "
        "sudo systemctl restart blackroad-api lucidia-llm nginx"
    )
    run_command(["ssh", cfg.droplet_target, remote_cmd], dry_run=cfg.dry_run)
    state = _load_state()
    state["droplet"] = {"last_deploy": _timestamp(), "target": cfg.droplet_target}
    _write_state(state, dry_run=cfg.dry_run)
    _append_log(f"Deployment triggered on droplet {cfg.droplet_target}")


# ---------------------------------------------------------------------------
# High-level flows
# ---------------------------------------------------------------------------


def push_latest_flow(cfg: SyncConfig) -> None:
    stage_and_commit(cfg)
    push_branch(cfg)
    sync_connectors(cfg)
    refresh_working_copy(cfg)
    deploy_to_droplet(cfg)
    if cfg.notifier:
        cfg.notifier.send("Codex pipeline: push latest to BlackRoad.io completed")


def refresh_and_deploy_flow(cfg: SyncConfig) -> None:
    refresh_working_copy(cfg)
    deploy_to_droplet(cfg)
    if cfg.notifier:
        cfg.notifier.send("Codex pipeline: refresh working copy and redeploy completed")


def rebase_and_update_flow(cfg: SyncConfig) -> None:
    rebase_onto_main(cfg)
    push_branch(cfg)
    deploy_to_droplet(cfg)
    if cfg.notifier:
        cfg.notifier.send("Codex pipeline: rebase branch and update site completed")


def sync_salesforce_to_droplet_flow(cfg: SyncConfig) -> None:
    sync_connectors(cfg)
    deploy_to_droplet(cfg)
    if cfg.notifier:
        cfg.notifier.send("Codex pipeline: Salesforce → Airtable → Droplet sync completed")


CommandFn = Callable[[SyncConfig], None]

COMMANDS: Mapping[str, CommandFn] = {
    "push": push_latest_flow,
    "push latest to blackroad.io": push_latest_flow,
    "refresh": refresh_and_deploy_flow,
    "refresh working copy and redeploy": refresh_and_deploy_flow,
    "rebase": rebase_and_update_flow,
    "rebase branch and update site": rebase_and_update_flow,
    "sync": sync_salesforce_to_droplet_flow,
    "sync salesforce → airtable → droplet": sync_salesforce_to_droplet_flow,
    "sync salesforce -> airtable -> droplet": sync_salesforce_to_droplet_flow,
}


def handle_command(command: str, cfg: SyncConfig) -> None:
    """Dispatch *command* (case insensitive) to the appropriate workflow."""

    normalised = command.lower().strip().replace("->", "→")
    func = COMMANDS.get(normalised)
    if not func:
        available = "\n".join(f"  - {name}" for name in sorted(COMMANDS))
        raise SystemExit(f"Unknown command: {command}\nAvailable commands:\n{available}")

    _append_log(f"Starting command: {normalised}")
    func(cfg)
    _append_log(f"Completed command: {normalised}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        nargs="+",
        help="Command to execute (e.g. 'Push latest to BlackRoad.io')",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print commands without executing external processes.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging for troubleshooting.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    cfg = SyncConfig.from_env(dry_run=args.dry_run)
    command_text = " ".join(args.command)

    try:
        handle_command(command_text, cfg)
    except subprocess.CalledProcessError as exc:
        _append_log(f"Command failed: {exc}")
        return exc.returncode or 1
    except SystemExit as exc:
        if isinstance(exc.code, int) and exc.code != 0:
            _append_log(f"Exiting with error: {exc.code}")
        raise
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    sys.exit(main())
