#!/usr/bin/env python3
"""
Improved BlackRoad.io deployment helper.

This script extends the basic scaffold found in the original project and
implements real operations for pushing code to GitHub, syncing external
connectors, refreshing a local Working Copy checkout and deploying the
application to a remote droplet.  Configuration is driven by environment
variables so credentials and targets can be supplied outside of the
repository.

Key environment variables:

* **BLACKROAD_REMOTE** – SSH target for the deployment droplet.  Defaults to
  ``root@droplet``.  This should be set to the form ``user@host``, e.g.
  ``deploy@192.0.2.10``.
* **BLACKROAD_REMOTE_PATH** – Path on the remote host where the application
  repository is checked out.  Defaults to ``/srv/blackroad``.
* **BLACKROAD_BRANCH** – Git branch to push and deploy.  Defaults to
  ``main``.
* **WORKING_COPY_CMD** – Optional command to refresh the iOS Working Copy
  client.  If unset, no Working Copy action is taken.
* **SLACK_WEBHOOK_URL** – Optional Slack Incoming Webhook URL.  When set,
  deployment status messages are sent to Slack.
* **SALESFORCE_TOKEN**, **AIRTABLE_TOKEN**, **LINEAR_TOKEN** – Tokens for
  external connectors.  If present, the ``sync_connectors`` function will
  attempt to post a webhook notification indicating that a sync should be
  triggered for each service.  Replace the placeholder URLs with your
  actual integration endpoints.

Usage examples:

    python3 improved_blackroad_deploy.py push "chore: update landing page"
    python3 improved_blackroad_deploy.py refresh
    python3 improved_blackroad_deploy.py rebase
    python3 improved_blackroad_deploy.py sync
    python3 improved_blackroad_deploy.py deploy

Each subcommand can also trigger a Slack notification if the webhook URL
is configured.  The script raises on errors so it is safe to use in a
CI/CD pipeline where failures should stop the pipeline.
"""

from __future__ import annotations

import os
import shlex
import subprocess
import sys
from dataclasses import dataclass
from typing import List, Optional
import json
import urllib.request


def run(cmd: List[str] | str) -> None:
    """Run a shell command and print it first.

    Args:
        cmd: Either a list of command/arguments or a string.  Strings are
            tokenised with ``shlex.split``.

    Raises:
        subprocess.CalledProcessError: if the command returns a non‑zero exit
            status.
    """
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    print("➜", " ".join(cmd))
    subprocess.run(cmd, check=True)


def send_slack_message(webhook: str, message: str) -> None:
    """Send a Slack message via Incoming Webhook if configured.

    Errors are ignored because Slack notifications should not block a
    deployment.

    Args:
        webhook: Slack incoming webhook URL.
        message: Message text to send.
    """
    if not webhook:
        return
    try:
        data = json.dumps({"text": message}).encode("utf-8")
        req = urllib.request.Request(webhook, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as exc:
        # Log the failure but continue; Slack should not stop the deployment
        print(f"Slack notification failed: {exc}")


@dataclass
class Config:
    """Deployment configuration loaded from environment variables."""

    remote: str = os.environ.get("BLACKROAD_REMOTE", "root@droplet")
    remote_path: str = os.environ.get("BLACKROAD_REMOTE_PATH", "/srv/blackroad")
    branch: str = os.environ.get("BLACKROAD_BRANCH", "main")
    working_copy_cmd: Optional[str] = os.environ.get("WORKING_COPY_CMD")
    slack_webhook: Optional[str] = os.environ.get("SLACK_WEBHOOK_URL")
    salesforce_token: Optional[str] = os.environ.get("SALESFORCE_TOKEN")
    airtable_token: Optional[str] = os.environ.get("AIRTABLE_TOKEN")
    linear_token: Optional[str] = os.environ.get("LINEAR_TOKEN")


class BlackRoadDeployer:
    """Encapsulates all deployment operations for BlackRoad.io."""

    def __init__(self, config: Config) -> None:
        self.config = config

    # GitHub operations ------------------------------------------------------
    def git_add_commit_push(self, message: str) -> None:
        """Add all changes, commit and push to the configured branch."""
        run(["git", "add", "-A"])
        # Use || true on commit because there may be nothing to commit
        try:
            run(["git", "commit", "-m", message])
        except subprocess.CalledProcessError:
            print("No changes to commit; continuing with push")
        run(["git", "pull", "--rebase", "origin", self.config.branch])
        run(["git", "push", "origin", self.config.branch])

    def git_rebase_push(self, message: str) -> None:
        """Rebase the current branch onto the remote branch and push."""
        run(["git", "fetch", "origin"])
        run(["git", "rebase", f"origin/{self.config.branch}"])
        self.git_add_commit_push(message)

    # Connector operations ----------------------------------------------------
    def sync_connectors(self) -> None:
        """Trigger external connectors if tokens are configured.

        This implementation sends POST requests to placeholder endpoints
        indicating that a sync should be triggered.  Replace the URLs with
        your actual integration endpoints.  If no tokens are present the
        sync is skipped.
        """
        tasks: List[str] = []
        if self.config.salesforce_token:
            tasks.append("Salesforce")
            # Example: send a webhook to your integration
            try:
                url = f"https://example.com/salesforce/sync?token={self.config.salesforce_token}"
                print(f"→ Triggering Salesforce sync via {url}")
                urllib.request.urlopen(url, timeout=10).read()
            except Exception as exc:
                print(f"Salesforce sync failed: {exc}")
        if self.config.airtable_token:
            tasks.append("Airtable")
            try:
                url = f"https://example.com/airtable/sync?token={self.config.airtable_token}"
                print(f"→ Triggering Airtable sync via {url}")
                urllib.request.urlopen(url, timeout=10).read()
            except Exception as exc:
                print(f"Airtable sync failed: {exc}")
        if self.config.linear_token:
            tasks.append("Linear")
            try:
                url = f"https://example.com/linear/sync?token={self.config.linear_token}"
                print(f"→ Triggering Linear sync via {url}")
                urllib.request.urlopen(url, timeout=10).read()
            except Exception as exc:
                print(f"Linear sync failed: {exc}")
        if not tasks:
            print("No connector tokens configured; skipping connector sync")
        else:
            print(f"Triggered sync for: {', '.join(tasks)}")

    # Working Copy operations -------------------------------------------------
    def refresh_working_copy(self) -> None:
        """Refresh the iOS Working Copy checkout if a command is configured."""
        if not self.config.working_copy_cmd:
            print("WORKING_COPY_CMD not set; skipping Working Copy refresh")
            return
        print(f"→ Refreshing Working Copy via command: {self.config.working_copy_cmd}")
        run(self.config.working_copy_cmd)

    # Droplet deployment ------------------------------------------------------
    def deploy_droplet(self) -> None:
        """Deploy the latest code to the remote droplet via SSH."""
        remote = self.config.remote
        if not remote:
            print("BLACKROAD_REMOTE not set; skipping droplet deployment")
            return
        path = self.config.remote_path
        branch = self.config.branch
        # Build the remote shell command: navigate to repo, pull, install deps, migrate, restart
        remote_cmd = (
            f"cd {shlex.quote(path)} && "
            f"git fetch origin {shlex.quote(branch)} && "
            f"git checkout {shlex.quote(branch)} && "
            f"git reset --hard origin/{shlex.quote(branch)} && "
            "npm install --omit=dev && "
            "npm run migrate && "
            "pm2 restart all && "
            "curl -fsS http://localhost/health"
        )
        print(f"→ Deploying to droplet {remote}:{path} on branch {branch}")
        # Run the remote command via SSH
        run(["ssh", remote, remote_cmd])

    # High level workflows ----------------------------------------------------
    def push_latest(self, commit_message: str) -> None:
        """Push latest changes and deploy."""
        self.git_add_commit_push(commit_message)
        self.sync_connectors()
        self.refresh_working_copy()
        self.deploy_droplet()
        send_slack_message(self.config.slack_webhook, "✅ Deployed latest to BlackRoad.io")

    def refresh_and_deploy(self) -> None:
        """Refresh Working Copy and redeploy."""
        self.refresh_working_copy()
        self.deploy_droplet()
        send_slack_message(self.config.slack_webhook, "🔄 Working Copy refreshed & redeployed")

    def rebase_and_deploy(self, commit_message: str) -> None:
        """Rebase branch onto remote, push and deploy."""
        self.git_rebase_push(commit_message)
        self.refresh_working_copy()
        self.deploy_droplet()
        send_slack_message(self.config.slack_webhook, "✅ Rebased & deployed latest to BlackRoad.io")

    def connectors_only(self) -> None:
        """Sync external connectors only."""
        self.sync_connectors()
        send_slack_message(self.config.slack_webhook, "🔌 Connector sync triggered")

    def deploy_only(self) -> None:
        """Deploy to droplet without pushing code."""
        self.deploy_droplet()
        send_slack_message(self.config.slack_webhook, "🚀 Deploy triggered")


def usage() -> None:
    print(
        """Usage: improved_blackroad_deploy.py <command> [commit message]

Commands:
  push [msg]        Add all changes, commit with [msg], push, sync and deploy
  refresh           Refresh Working Copy and deploy
  rebase [msg]      Rebase branch on origin, commit with [msg], push and deploy
  sync              Trigger external connector synchronisation only
  deploy            Deploy the current branch without pushing local changes

Environment variables control the deployment targets and tokens; see the
module docstring for details.
"""
    )


def main(argv: List[str]) -> None:
    if not argv:
        usage()
        sys.exit(1)
    cmd = argv[0].lower()
    config = Config()
    deployer = BlackRoadDeployer(config)
    if cmd == "push":
        message = argv[1] if len(argv) > 1 else "chore: automated commit"
        deployer.push_latest(message)
    elif cmd == "refresh":
        deployer.refresh_and_deploy()
    elif cmd == "rebase":
        message = argv[1] if len(argv) > 1 else "chore: rebase and deploy"
        deployer.rebase_and_deploy(message)
    elif cmd == "sync":
        deployer.connectors_only()
    elif cmd == "deploy":
        deployer.deploy_only()
    else:
        usage()
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])
