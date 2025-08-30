#!/usr/bin/env python3
"""
BlackRoad Codex Sync/Deploy

Scaffolds end-to-end pipeline steps for BlackRoad.io:
- Push latest commits to GitHub
- Sync Salesforce/Airtable/Slack/Linear connectors
- Refresh Working Copy on iOS
- Pull & deploy on the production droplet

The module exposes a simple chat-style interface. Invoke with a natural
language command and the script routes to the appropriate actions.

Examples:
    python3 codex/tools/blackroad_deploy.py "Push latest to BlackRoad.io"
    python3 codex/tools/blackroad_deploy.py "Refresh working copy and redeploy"

Environment variables:
    BLACKROAD_REMOTE       SSH target for the droplet (default: root@droplet)
    BLACKROAD_REMOTE_PATH  Path on droplet to pull & build (default: /srv/blackroad)
    BLACKROAD_BRANCH       Git branch to push/pull (default: main)
    WORKING_COPY_CMD       Optional local command to refresh iOS Working Copy
    SLACK_WEBHOOK_URL      Optional webhook for status messages

Note: This is a scaffold. Connector logic and remote commands should be
expanded to match the actual infrastructure.
"""

from __future__ import annotations

import os
import shlex
import subprocess
import sys
from dataclasses import dataclass


def run(cmd: str | list[str]) -> None:
    """Run a shell command, echoing it first."""
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    print("➜", " ".join(cmd))
    subprocess.run(cmd, check=True)


@dataclass
class BlackRoadDeployer:
    remote: str = os.environ.get("BLACKROAD_REMOTE", "root@droplet")
    remote_path: str = os.environ.get("BLACKROAD_REMOTE_PATH", "/srv/blackroad")
    branch: str = os.environ.get("BLACKROAD_BRANCH", "main")
    working_copy_cmd: str | None = os.environ.get("WORKING_COPY_CMD")
    slack_webhook: str | None = os.environ.get("SLACK_WEBHOOK_URL")

    # --- GitHub ---
    def push_latest(self) -> None:
        """Push local commits to GitHub."""
        run(["git", "push", "origin", self.branch])

    def rebase_branch(self) -> None:
        """Rebase branch on top of origin and push."""
        run(["git", "pull", "--rebase", "origin", self.branch])
        self.push_latest()

    # --- Connectors ---
    def sync_connectors(self) -> None:
        """Placeholder connector sync."""
        print("⚙ Syncing connectors: Salesforce, Airtable, Slack, Linear")
        # TODO: Implement OAuth and webhook triggers per service

    # --- Working Copy (iOS) ---
    def refresh_working_copy(self) -> None:
        if self.working_copy_cmd:
            run(self.working_copy_cmd)
        else:
            print("ℹ WORKING_COPY_CMD not set; skipping iOS refresh")

    # --- Droplet deployment ---
    def deploy_droplet(self) -> None:
        cmd = (
            f"cd {self.remote_path} && git pull && "
            "npm install --omit=dev && npm run migrate && "
            "pm2 restart all && curl -fsS http://localhost/health"
        )
        run(["ssh", self.remote, cmd])

    # --- Slack ---
    def slack_notify(self, message: str) -> None:
        if not self.slack_webhook:
            return
        run([
            "curl",
            "-sS",
            "-X", "POST",
            self.slack_webhook,
            "-H", "Content-Type: application/json",
            "-d", f'{{"text": "{message}"}}',
        ])

    # --- Command router ---
    def handle(self, text: str) -> None:
        t = text.lower()
        if "push" in t and "blackroad" in t:
            self.push_latest()
            self.sync_connectors()
            self.refresh_working_copy()
            self.deploy_droplet()
            self.slack_notify("✅ Deployed latest to BlackRoad.io")
        elif "refresh" in t and "working copy" in t:
            self.refresh_working_copy()
            self.slack_notify("🔄 Working Copy refreshed")
        elif "rebase" in t and "branch" in t:
            self.rebase_branch()
            self.refresh_working_copy()
            self.deploy_droplet()
            self.slack_notify("✅ Rebased & deployed")
        elif "sync" in t:
            self.sync_connectors()
            self.slack_notify("🔌 Connectors sync triggered")
        elif "deploy" in t:
            self.deploy_droplet()
            self.slack_notify("🚀 Deploy triggered")
        else:
            print(f"Unknown command: {text}")


def main(argv: list[str]) -> None:
    cmd_text = " ".join(argv) if argv else input("BlackRoad command: ")
    BlackRoadDeployer().handle(cmd_text)


if __name__ == "__main__":
    main(sys.argv[1:])
