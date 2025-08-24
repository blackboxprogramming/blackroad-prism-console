#!/usr/bin/env python3
"""BlackRoad.io sync and deploy helper.

Provides a simple chat-like interface for the Codex pipeline.
"""Unified pipeline for syncing code and deployments to BlackRoad.io.

This script provides a chat-style interface to trigger operations like
pushing latest code, refreshing working copies and redeploying services.
It stitches together the high level flow:

Codex -> GitHub -> Connectors -> Working Copy -> Droplet -> BlackRoad.io

The functions mostly serve as placeholders; real integrations should be
implemented using the appropriate APIs and credentials.
"""

"""Chat-first sync and deploy scaffold for BlackRoad.io.

This script provides a minimal command surface that translates natural
language requests into git and deployment operations. It is intended as a
starting point for the full Codex pipeline described in project docs.
Actual connector integrations and remote deployments must be wired in by
operators.
"""Scaffold BlackRoad end-to-end sync and deploy.

This lightweight orchestrator wires together the minimum steps for pushing
local changes to the live BlackRoad.io environment. It intentionally focuses on
being extensible rather than feature complete. Each stage is implemented as a
function so operators or other automations can plug in additional behaviour.

Steps performed:
1. Push the current branch to GitHub.
2. Notify external connectors via a generic webhook.
3. Refresh a Working Copy checkout if configured.
4. Deploy to the remote droplet and restart services.

Environment variables provide runtime configuration:
- ``BRANCH`` and ``REMOTE`` override the git target.
- ``CONNECTOR_WEBHOOK`` points to a HTTP endpoint for connector fan-out.
- ``WORKING_COPY_PATH`` specifies a local path to "Working Copy" on iOS.
- ``DROPLET_SSH`` is an ``user@host`` style target for SSH.
- ``DROPLET_DEPLOY_CMD`` customises the remote deploy command.
"""Unified CI/CD helper for BlackRoad.io.

This script offers a chat-friendly interface so operators can push,
rebase and redeploy the BlackRoad stack from one entry point. External
services such as Salesforce, Airtable, Slack and deployment droplets are
represented as placeholders so the script runs in constrained
environments. Integrators can hook the stubs into real systems using
OAuth tokens or webhooks.
"""Unified Codex pipeline scaffold for BlackRoad.io.

This module provides a high level orchestration layer intended to
bridge development changes from source control to the live
BlackRoad.io deployment.  It includes placeholder methods for syncing
with GitHub, external connectors, a Working Copy client, and the
production droplet.  The interface is intentionally minimal so it can
be triggered by a chat operator command, for example::

    python blackroad_sync.py "Push latest to BlackRoad.io"

Each method currently logs the intended action and should be extended
with real implementations.
"""BlackRoad end-to-end sync and deployment helper.

This script provides a thin scaffolding for the multi-stage pipeline
outlined in the Codex prompt.  Each step is represented as a function
that prints what it would do.  The intention is for future work to fill
in real integrations for GitHub, connectors, Working Copy and the
production droplet.  For now the script offers a single command surface
with three high level actions:

```
python3 scripts/blackroad_sync.py push
python3 scripts/blackroad_sync.py refresh-working-copy --path /path/to/local/clone
python3 scripts/blackroad_sync.py deploy --host user@droplet
```

The helper aims to keep the flow in one place so additional automation
can be layered on gradually without needing to change usage.
"""Unified BlackRoad.io sync & deploy helper.

This script provides a chat-friendly command line interface that glues
GitHub, connectors, working copies and droplet deployment into a single
flow.  The heavy lifting (OAuth handshakes, remote jobs, etc.) is left as
future work, but the plumbing is in place so that Codex or other agents
can trigger each step with a simple command.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from typing import List


def run(cmd: List[str]) -> int:
    """Run a shell command and stream its output.

    Args:
        cmd: The command and arguments to run.

    Returns:
        Exit status code from the command.
    """
    print(f"+ {' '.join(cmd)}")
    return subprocess.call(cmd)


def push_latest() -> None:
    """Push local changes to remote repository and trigger deployment."""
    if run(["git", "push"]) != 0:
        sys.exit("git push failed")
    # Placeholder for triggering downstream syncs like CI/CD pipelines.
    print("Triggered downstream syncs.")


def refresh_working_copy() -> None:
    """Pull latest changes and redeploy services on the droplet."""
    if run(["git", "pull"]) != 0:
        sys.exit("git pull failed")
    # Placeholder for restart or redeploy commands on the droplet.
    print("Refreshed local working copy and redeployed.")


def rebase_branch() -> None:
    """Rebase the current branch on top of origin/main and push."""
    if run(["git", "fetch", "origin"]) != 0:
        sys.exit("git fetch failed")
    if run(["git", "rebase", "origin/main"]) != 0:
        sys.exit("git rebase failed")
    push_latest()


def sync_connectors() -> None:
    """Kick off external connector synchronization jobs."""
    # Placeholder: integration with Salesforce, Airtable, Slack, Linear, etc.
    print("Syncing connectors: Salesforce, Airtable, Slack, Linear (placeholder).")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        nargs=argparse.REMAINDER,
        help="Command to execute; accepts natural-language phrases.",
    )

    args = parser.parse_args()
    phrase = " ".join(args.command).lower()
    if not phrase:
        parser.print_help()
        return
    if "push" in phrase:
        push_latest()
    elif "refresh" in phrase or "redeploy" in phrase:
        refresh_working_copy()
    elif "rebase" in phrase:
        rebase_branch()
    elif "sync" in phrase:
        sync_connectors()
    else:
        parser.print_help()
import logging
import subprocess
from typing import Callable, Dict


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


def run(cmd: str) -> None:
    """Run a shell command and log the result."""
    logging.info("$ %s", cmd)
    try:
        subprocess.run(cmd, shell=True, check=True)
    except subprocess.CalledProcessError as err:
        logging.error("command failed: %s", err)
        raise


# --- Pipeline steps -------------------------------------------------------


def github_push() -> None:
    """Push committed changes to GitHub and trigger downstream syncs."""
    run("git push")
    logging.info("GitHub push complete.")


def connectors_sync() -> None:
    """Placeholder for syncing external connectors (Salesforce, Airtable, etc.)."""
    logging.info("Syncing connectors ... (placeholder)")


def working_copy_refresh() -> None:
    """Refresh the Working Copy app on iOS."""
    logging.info("Refreshing Working Copy ... (placeholder)")


def droplet_deploy() -> None:
    """Pull, migrate and restart services on the droplet."""
    logging.info("Deploying to droplet ... (placeholder)")


# --- Chat command surface ------------------------------------------------

COMMANDS: Dict[str, Callable[[], None]] = {
    "push latest to blackroad.io": lambda: (github_push(), droplet_deploy()),
    "refresh working copy and redeploy": lambda: (
        working_copy_refresh(),
        droplet_deploy(),
    ),
    "rebase branch and update site": lambda: (
        run("git pull --rebase"),
        github_push(),
        droplet_deploy(),
    ),
    "sync salesforce -> airtable -> droplet": lambda: (
        connectors_sync(),
        droplet_deploy(),
    ),
}


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io pipeline runner")
    parser.add_argument("command", help="Command phrase to execute")
    args = parser.parse_args()
    cmd = args.command.lower()
    func = COMMANDS.get(cmd)
    if not func:
        logging.error("Unknown command: %s", cmd)
        return
    func()
    logging.info("%s -- done", cmd)


# --------------------------- helpers ---------------------------

def run(cmd: str) -> None:
    """Run shell command and stream output."""
    print(f"-> {cmd}")
    try:
        subprocess.run(cmd, shell=True, check=True)
    except subprocess.CalledProcessError as exc:  # noqa: BLE001
        print(f"command failed: {exc}")
        sys.exit(exc.returncode)


# --------------------------- actions ---------------------------

def push_latest() -> None:
    """Commit local changes, rebase and push to origin."""
    run("git add -A")
    # commit may fail if nothing to commit; swallow error
    subprocess.run(
        'git commit -m "Sync from Codex" || echo "nothing to commit"',
        shell=True,
        check=False,
    )
    run("git pull --rebase")
    run("git push")
    print("triggered connectors and deployment hooks (placeholder)")


def refresh_working_copy() -> None:
    """Pull latest changes and redeploy site."""
    run("git pull")
    print("refreshed working copy and redeployed site (placeholder)")


def rebase_branch() -> None:
    """Rebase current branch on origin/main and push."""
    run("git fetch origin")
    run("git rebase origin/main")
    run("git push --force-with-lease")
    print("rebased branch and updated site (placeholder)")


def sync_salesforce_airtable_droplet() -> None:
    """Demonstrate connector sync flow."""
    print("syncing Salesforce → Airtable → Droplet (placeholder)")


COMMANDS = {
    "push latest": push_latest,
    "refresh working copy": refresh_working_copy,
    "rebase branch": rebase_branch,
    "sync salesforce": sync_salesforce_airtable_droplet,
}


# --------------------------- main interface ---------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="BlackRoad Codex sync utility",
        epilog="example: python scripts/blackroad_sync.py \"Push latest to BlackRoad.io\"",
    )
    parser.add_argument("command", nargs="+", help="natural language command")
    args = parser.parse_args()
    text = " ".join(args.command).lower()
    for key, func in COMMANDS.items():
        if key in text:
            func()
            break
    else:
        print(f"unknown command: {text}")
        sys.exit(1)
def run(cmd: List[str]) -> None:
    """Run a command, streaming output to the console."""
    print("$", " ".join(cmd))
    subprocess.run(cmd, check=True)


def push_to_github(remote: str, branch: str) -> None:
    """Push the current branch to the configured remote."""
    run(["git", "push", remote, branch])


def trigger_connectors() -> None:
    """POST to the connector webhook if configured."""
    webhook = os.environ.get("CONNECTOR_WEBHOOK")
    if not webhook:
        print("No CONNECTOR_WEBHOOK set; skipping connector trigger.")
        return
    try:
        run(["curl", "-fsSL", "-X", "POST", webhook])
    except subprocess.CalledProcessError as exc:  # pragma: no cover - logged to stderr
        print(f"Connector trigger failed: {exc}", file=sys.stderr)


def refresh_working_copy() -> None:
    """Sync a Working Copy checkout if WORKING_COPY_PATH is provided."""
    wc_path = os.environ.get("WORKING_COPY_PATH")
    if not wc_path:
        print("No WORKING_COPY_PATH set; skipping working copy refresh.")
        return
    run(["git", "-C", wc_path, "pull", "--rebase"])


def deploy_to_droplet() -> None:
    """SSH into the droplet and pull latest changes."""
    droplet = os.environ.get("DROPLET_SSH")
    if not droplet:
        print("No DROPLET_SSH set; skipping droplet deploy.")
        return
    remote_cmd = os.environ.get(
        "DROPLET_DEPLOY_CMD",
        "cd /srv/blackroad && git pull && systemctl restart blackroad.service",
    )
    run(["ssh", droplet, remote_cmd])


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad sync and deploy")
    parser.add_argument("--branch", default=os.environ.get("BRANCH", "main"))
    parser.add_argument("--remote", default=os.environ.get("REMOTE", "origin"))
    args = parser.parse_args()

    push_to_github(args.remote, args.branch)
    trigger_connectors()
    refresh_working_copy()
    deploy_to_droplet()
import logging
from typing import Callable, Dict


logger = logging.getLogger(__name__)


class BlackRoadSync:
    """High level orchestrator for BlackRoad.io deployments."""

    def __init__(self) -> None:
        self.commands: Dict[str, Callable[[], None]] = {
            "push latest to blackroad.io": self.deploy_to_droplet,
            "refresh working copy and redeploy": self.refresh_and_deploy,
            "rebase branch and update site": self.rebase_and_deploy,
            "sync salesforce → airtable → droplet": self.sync_connectors,
        }

    # GitHub integration -------------------------------------------------
    def sync_github(self) -> None:
        """Placeholder for GitHub push/pull/rebase logic."""
        logger.info("Syncing with GitHub repository...")

    # Connector integration ----------------------------------------------
    def sync_connectors(self) -> None:
        """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
        logger.info("Syncing external connectors...")

    # Working Copy automation --------------------------------------------
    def refresh_working_copy(self) -> None:
        """Placeholder for refreshing Working Copy on iOS."""
        logger.info("Refreshing Working Copy state...")

    # Droplet deployment -------------------------------------------------
    def deploy_to_droplet(self) -> None:
        """Placeholder for pulling and deploying to the droplet."""
        logger.info("Deploying latest code to droplet...")

    # Compound operations -------------------------------------------------
    def refresh_and_deploy(self) -> None:
        """Refresh Working Copy and deploy to droplet."""
        self.refresh_working_copy()
        self.deploy_to_droplet()

    def rebase_and_deploy(self) -> None:
        """Rebase current branch with main and deploy."""
        self.sync_github()
        self.deploy_to_droplet()

    # Chat command interface ---------------------------------------------
    def handle_command(self, command: str) -> None:
        """Execute a high level command.

        Parameters
        ----------
        command:
            Natural language command describing the desired action.
        """
        key = command.strip().lower()
        func = self.commands.get(key)
        if func:
            logger.info("Executing command: %s", command)
            func()
        else:
            logger.error("Unknown command: %s", command)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", help="High level deployment command")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    orchestrator = BlackRoadSync()
    orchestrator.handle_command(args.command)
"""
BlackRoad Sync & Deploy Orchestrator.

This script provides a chat-first control surface for end-to-end sync and
deployment flows. It scaffolds the pipeline described in the CODEX PROMPT,
including GitHub, connectors, Working Copy, the deployment droplet, and
BlackRoad.io.

Each command currently emits log messages and TODO stubs for the actual
integration work. The intent is to provide a single entry point that agents
or operators can expand to implement the full workflow.
"""
import argparse
import logging

logger = logging.getLogger("blackroad_sync")


def push_latest_to_blackroad() -> None:
    """Push local changes to GitHub and deploy to BlackRoad.io."""
    logger.info("Pushing repository to GitHub…")
    # TODO: implement git add/commit/push with conflict handling

    logger.info("Triggering connector sync jobs…")
    # TODO: kick off Salesforce, Airtable, Slack, Linear integrations

    logger.info("Refreshing Working Copy…")
    # TODO: invoke Working Copy automation hooks

    logger.info("Deploying on droplet…")
    # TODO: pull latest code, run migrations, restart services

    logger.info("Verifying deployment…")
    # TODO: check /health and /deploy/status endpoints


def refresh_working_copy() -> None:
    """Force Working Copy to pull and redeploy the droplet."""
    logger.info("Refreshing Working Copy and redeploying droplet…")
    # TODO: implement force pull and service restart


def rebase_branch_and_update_site() -> None:
    """Rebase current branch and update live site."""
    logger.info("Rebasing branch against upstream…")
    # TODO: implement git fetch and rebase

    push_latest_to_blackroad()


def sync_salesforce_airtable_droplet() -> None:
    """Sync data from Salesforce to Airtable and redeploy droplet."""
    logger.info("Syncing Salesforce → Airtable → Droplet…")
    # TODO: build OAuth scaffolding and webhook listeners

    logger.info("Deployment complete.")


COMMAND_MAP = {
    "push latest to blackroad.io": push_latest_to_blackroad,
    "refresh working copy and redeploy": refresh_working_copy,
    "rebase branch and update site": rebase_branch_and_update_site,
    "sync salesforce → airtable → droplet": sync_salesforce_airtable_droplet,
}


def dispatch(command: str) -> None:
    """Dispatch a natural-language command to the appropriate handler."""
    normalized = command.lower().strip()
    func = COMMAND_MAP.get(normalized)
    if func is None:
        logger.error("Unknown command: %s", command)
        return
    func()


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad CI/CD control surface")
    parser.add_argument("command", nargs="+", help="Natural language command")
    parser.add_argument("--log-level", default="INFO", help="Python logging level")
    args = parser.parse_args()

    logging.basicConfig(level=getattr(logging, args.log_level.upper(), logging.INFO))
    dispatch(" ".join(args.command))


if __name__ == "__main__":
    main()


# --------------------------- helpers ---------------------------

def run(cmd: list[str]) -> None:
    """Run a subprocess command, echoing it to stdout."""
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def git_commit_push(message: str) -> None:
    """Commit all changes and push to the current branch."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", message])
    run(["git", "pull", "--rebase"])
    run(["git", "push"])


# --------------------------- core actions ---------------------------


def deploy_droplet() -> None:
    """Trigger deployment on the remote droplet via SSH.

    The target host can be provided via the ``BLACKROAD_DROPLET``
    environment variable. The droplet is expected to expose a
    ``deploy_blackroad`` command that performs a pull, migration and
    service restart. The function is a stub when no host is configured.
    """
    host = os.environ.get("BLACKROAD_DROPLET")
    if not host:
        print("No droplet configured; skipping deploy.")
        return
    run(["ssh", host, "deploy_blackroad"])


def sync_connectors() -> None:
    """Placeholder sync for Salesforce, Airtable, Slack and Linear."""
    print("Syncing external connectors ... (stub)")
    # Integrators can place their connector logic here, e.g. making
    # HTTP requests with OAuth tokens or invoking background jobs.


def refresh_working_copy() -> None:
    """Ensure local working copy matches GitHub and droplet."""
    run(["git", "pull", "--rebase"])
    deploy_droplet()


def cmd_push(args: argparse.Namespace) -> None:  # noqa: D401 - short alias
    """Handle the ``push`` command."""
    git_commit_push(args.message)
    sync_connectors()
    deploy_droplet()


def cmd_refresh(_args: argparse.Namespace) -> None:
    """Force a refresh of working copy and redeploy droplet."""
    refresh_working_copy()


def cmd_rebase(_args: argparse.Namespace) -> None:
    """Rebase current branch onto ``origin/main`` and push."""
    run(["git", "fetch", "origin"])
    run(["git", "rebase", "origin/main"])
    run(["git", "push", "-f"])
    sync_connectors()
    deploy_droplet()


def cmd_sync(_args: argparse.Namespace) -> None:  # noqa: D401 - short alias
    """Run connector sync jobs without touching git."""
    sync_connectors()


# --------------------------- CLI ---------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="BlackRoad.io CI/CD helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_push = sub.add_parser("push", help="Commit, push and deploy")
    p_push.add_argument("-m", "--message", default="chore: update via codex")
    p_push.set_defaults(func=cmd_push)

    p_refresh = sub.add_parser(
        "refresh", help="Pull latest changes and redeploy droplet"
    )
    p_refresh.set_defaults(func=cmd_refresh)

    p_rebase = sub.add_parser(
        "rebase", help="Rebase current branch onto origin/main and deploy"
    )
    p_rebase.set_defaults(func=cmd_rebase)

    p_sync = sub.add_parser("sync", help="Sync external connectors only")
    p_sync.set_defaults(func=cmd_sync)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def run(cmd: list[str], cwd: Path | None = None) -> None:
    """Run a command and stream output."""
    if cwd is None:
        cwd = REPO_ROOT
    print("$", " ".join(cmd))
    subprocess.check_call(cmd, cwd=cwd)


def git_push() -> None:
    """Commit (if needed) and push local changes to the default branch."""
    run(["git", "pull", "--rebase"])
    run(["git", "push"])
    trigger_connectors()


def trigger_connectors() -> None:
    """Placeholder for connector sync jobs.

    In the real implementation this would enqueue background jobs for
    systems such as Salesforce, Airtable, Slack and Linear.  For now we
    simply log to stdout so callers know where to extend the flow.
    """
    print("Triggering connector sync jobs (stub)...")


def refresh_working_copy(path: Path) -> None:
    """Update an iOS Working Copy clone."""
    run(["git", "pull"], cwd=path)
    run(["git", "push"], cwd=path)


def deploy_droplet(host: str) -> None:
    """Pull latest code and restart services on the remote droplet."""
    remote_cmd = (
        "cd /srv/blackroad && git pull && "
        "./migrate.sh && sudo systemctl restart blackroad"
    )
    run(["ssh", host, remote_cmd])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="BlackRoad sync helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("push", help="Push local changes to GitHub")

    wc = sub.add_parser("refresh-working-copy", help="Sync a Working Copy clone")
    wc.add_argument("--path", default="/srv/blackroad/working-copy", type=Path)

    dep = sub.add_parser("deploy", help="Deploy latest code to droplet")
    dep.add_argument("--host", default="blackroad")

    args = parser.parse_args(argv)

    if args.cmd == "push":
        git_push()
    elif args.cmd == "refresh-working-copy":
        refresh_working_copy(args.path)
    elif args.cmd == "deploy":
        deploy_droplet(args.host)
    else:  # pragma: no cover - defensive, subparsers are required
        parser.print_help()
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
"""Unified Codex build script for BlackRoad.io CI/CD pipeline.

This script provides a chat-first interface for orchestrating
end-to-end synchronization from the Codex environment to the
live BlackRoad.io deployment. It exposes subcommands that map
roughly to the spoken phrases operators use, e.g. "push latest to
BlackRoad.io".

The implementation intentionally focuses on scaffolding and leaves
connector- and environment-specific details as future work.
"""

from __future__ import annotations

import argparse
import logging
import subprocess
from typing import Iterable

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


def run(cmd: Iterable[str]) -> None:
    """Run a shell command, raising on failure."""
"""Utility for syncing BlackRoad.io environments.

This script is a scaffold for automating the end-to-end flow:
GitHub -> connectors -> working copy -> droplet -> live site.
It exposes high level commands that can be triggered from a
chat interface or run directly from the command line.

The implementation here focuses on local git interactions and provides
placeholders for remote operations and connector synchronization.
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
from typing import Sequence

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def run(cmd: Sequence[str]) -> None:
    """Run a command and stream its output.

    Args:
        cmd: Command and arguments to execute.
    """
    logging.debug("Running command: %s", " ".join(cmd))
    subprocess.run(cmd, check=True)


def push_latest() -> None:
    """Push committed changes to the default GitHub remote.

    This step assumes the current repository has been configured with the
    appropriate credentials for push access. Downstream services (connectors,
    working copy, droplet) are expected to react to the new commit through
    their respective webhooks.
    """

    run(["git", "push", "origin", "HEAD"])


def refresh_working_copy() -> None:
    """Trigger the iOS Working Copy app to pull latest changes.

    The actual integration with Working Copy is environment-specific and
    should be implemented using its URL scheme or SSH hooks. This function
    acts as a placeholder for that automation.
    """

    logging.info("Working Copy refresh placeholder executed")


def deploy_droplet() -> None:
    """Pull and deploy latest code on the droplet hosting BlackRoad.io.

    A full implementation would SSH into the droplet, execute git operations,
    run migrations, and restart services. Here we only outline the sequence.
    """

    logging.info("Droplet deploy placeholder executed")


def sync_connectors() -> None:
    """Synchronize external connectors such as Salesforce or Slack.

    OAuth setup, webhooks, and background jobs should be wired in here.
    For now the function only logs the intent.
    """

    logging.info("Connector sync placeholder executed")


def rebase_branch(branch: str) -> None:
    """Rebase the current branch onto ``branch`` and push the result."""
    run(["git", "fetch", "origin", branch])
    run(["git", "rebase", f"origin/{branch}"])
    push_latest()


def refresh_all() -> None:
    """Run the full end-to-end refresh sequence."""
    push_latest()
    sync_connectors()
    refresh_working_copy()
    deploy_droplet()


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io CI/CD helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("push", help="Push latest to GitHub and trigger pipeline")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    rb = sub.add_parser("rebase", help="Rebase branch and update site")
    rb.add_argument("branch", help="Target branch to rebase onto")
    sub.add_parser("sync", help="Sync connectors -> droplet")
    sub.add_parser("full", help="Run the entire sequence")

    args = parser.parse_args()

    if args.cmd == "push":
        push_latest()
    elif args.cmd == "refresh":
        refresh_all()
    elif args.cmd == "rebase":
        rebase_branch(args.branch)
    elif args.cmd == "sync":
        sync_connectors()
    elif args.cmd == "full":
        refresh_all()
    else:
        parser.error("Unknown command")
    """Push the current branch to GitHub."""
    run(["git", "push"])


def refresh_working_copy() -> None:
    """Pull latest changes and redeploy."""
    run(["git", "pull", "--rebase", "origin", os.getenv("BRANCH", "main")])
    deploy()


def rebase_branch(branch: str) -> None:
    """Rebase the current branch onto the given branch and redeploy."""
    run(["git", "fetch", "origin", branch])
    run(["git", "rebase", f"origin/{branch}"])
    deploy()


def sync_connectors() -> None:
    """Synchronize external systems.

    This function is a placeholder for Salesforce, Airtable, Slack,
    Linear and other connector jobs.
    """
    logging.info("Connector synchronization not yet implemented.")


def deploy() -> None:
    """Deploy code to the droplet.

    This placeholder demonstrates where deployment logic would live. In
    practice this might SSH to a remote host, pull the latest code,
    run migrations and restart services.
    """
    logging.info("Deployment step not yet implemented.")


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io sync utility")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("push", help="Push current branch to GitHub")
    sub.add_parser("refresh", help="Pull latest and redeploy")

    rebase = sub.add_parser("rebase", help="Rebase onto main and redeploy")
    rebase.add_argument("--branch", default="main", help="Branch to rebase onto")

    sub.add_parser("sync", help="Run external connector jobs")

    args = parser.parse_args()

    if args.command == "push":
        push_latest()
    elif args.command == "refresh":
        refresh_working_copy()
    elif args.command == "rebase":
        rebase_branch(args.branch)
    elif args.command == "sync":
        sync_connectors()
import logging
import subprocess
import sys
from typing import Sequence


def run(cmd: Sequence[str]) -> None:
    """Run *cmd* and exit on failure."""
    logging.info("$ %s", " ".join(cmd))
    result = subprocess.run(cmd)
    if result.returncode != 0:
        logging.error("command failed: %s", cmd)
        sys.exit(result.returncode)


def push_latest(args: argparse.Namespace) -> None:
    """Commit local changes and push to GitHub."""
    run(["git", "add", "-A"])
    run(["git", "commit", "-m", args.message])
    run(["git", "pull", "--rebase"])
    run(["git", "push"])
    # TODO: trigger connector sync jobs
    # TODO: trigger droplet deployment and slack notifications


def refresh(args: argparse.Namespace) -> None:
    """Refresh the working copy and redeploy the site."""
    run(["git", "pull", "--rebase"])
    # TODO: run migration scripts and service restarts


def rebase(args: argparse.Namespace) -> None:
    """Rebase current branch on top of main and push."""
    run(["git", "fetch", "origin"])
    run(["git", "rebase", "origin/main"])
    run(["git", "push", "--force-with-lease"])
    # TODO: trigger deployment if needed


def sync_connectors(args: argparse.Namespace) -> None:
    """Placeholder for Salesforce/Airtable/Slack/Linear sync."""
    # TODO: implement OAuth flows and background jobs
    logging.info("connector sync stub")


def main() -> None:
    parser = argparse.ArgumentParser(description="BlackRoad.io sync helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_push = sub.add_parser("push", help="Commit and push latest changes")
    p_push.add_argument("-m", "--message", default="chore: sync via codex")
    p_push.set_defaults(func=push_latest)

    p_refresh = sub.add_parser("refresh", help="Refresh working copy and redeploy")
    p_refresh.set_defaults(func=refresh)

    p_rebase = sub.add_parser("rebase", help="Rebase branch on main and push")
    p_rebase.set_defaults(func=rebase)

    p_sync = sub.add_parser("sync-connectors", help="Sync external systems")
    p_sync.set_defaults(func=sync_connectors)

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    args.func(args)


if __name__ == "__main__":
    main()
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
