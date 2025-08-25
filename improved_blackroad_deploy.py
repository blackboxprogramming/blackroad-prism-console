#!/usr/bin/env python3
"""Improved deployment script for BlackRoad.

This script handles pushing local changes to the GitHub remote,
triggering optional connector webhooks, refreshing Working Copy and
running a deployment command on a remote server over SSH.  The
behaviour is driven by environment variables so it can run in GitHub
Actions or locally.

Environment variables:
    BLACKROAD_BRANCH: Target git branch (default: ``main``).
    BLACKROAD_REMOTE: SSH target used for remote deployment.
    BLACKROAD_REMOTE_PATH: Path on the remote host to run deployment.
    WORKING_COPY_CMD: Optional command to refresh a Working Copy client.
    SLACK_WEBHOOK_URL: Optional Slack webhook to notify on completion.
    SALESFORCE_TOKEN / AIRTABLE_TOKEN / LINEAR_TOKEN: Optional tokens
        to call third party connectors.

Usage:
    python improved_blackroad_deploy.py push "Commit message"
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from typing import Dict

import requests


def run(cmd: list[str]) -> None:
    """Run *cmd* and stream output."""
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def trigger_connector(name: str, url: str, token: str) -> None:
    """Post to an external webhook if a token is supplied."""
    try:
        resp = requests.post(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
        resp.raise_for_status()
    except Exception as exc:  # pragma: no cover - best effort
        print(f"{name} webhook failed: {exc}")


def run_remote_deploy(remote: str, path: str) -> None:
    deploy_cmd = f"cd {path} && git pull && docker compose up -d"
    run(["ssh", remote, deploy_cmd])


def refresh_working_copy(cmd: str) -> None:
    run(cmd.split())


def git_push(commit_message: str, branch: str) -> None:
    run(["git", "fetch", "origin"]) 
    run(["git", "rebase", f"origin/{branch}"])
    # allow empty commit to record deployment
    run(["git", "commit", "--allow-empty", "-m", commit_message])
    run(["git", "push", "origin", branch])


CONNECTOR_URLS: Dict[str, str] = {
    "SALESFORCE_TOKEN": "https://api.salesforce.com/deploy",
    "AIRTABLE_TOKEN": "https://api.airtable.com/deploy",
    "LINEAR_TOKEN": "https://connect.linear.app/deploy",
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    push = sub.add_parser("push", help="push commits and deploy")
    push.add_argument("message", help="commit message for deployment")

    args = parser.parse_args(argv)

    branch = os.getenv("BLACKROAD_BRANCH", "main")

    if args.cmd == "push":
        git_push(args.message, branch)

    remote = os.getenv("BLACKROAD_REMOTE")
    remote_path = os.getenv("BLACKROAD_REMOTE_PATH")
    if remote and remote_path:
        run_remote_deploy(remote, remote_path)

    working_copy_cmd = os.getenv("WORKING_COPY_CMD")
    if working_copy_cmd:
        refresh_working_copy(working_copy_cmd)

    for env_var, url in CONNECTOR_URLS.items():
        token = os.getenv(env_var)
        if token:
            trigger_connector(env_var[:-6].lower(), url, token)

    slack = os.getenv("SLACK_WEBHOOK_URL")
    if slack:
        try:
            requests.post(slack, json={"text": f"Deployment complete: {args.message}"}, timeout=10)
        except Exception as exc:  # pragma: no cover - best effort
            print(f"Slack notification failed: {exc}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
