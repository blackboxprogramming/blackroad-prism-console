#!/usr/bin/env python3
"""
Codex Build Pipeline
--------------------
Scaffolds an end-to-end sync & deploy flow for BlackRoad.io.

Features
~~~~~~~~
* GitHub commit/push helper with auto-merge/rebase.
* Connector stubs for Salesforce, Airtable, Slack and Linear.
* Working Copy (iOS) pull/push automation.
* Droplet deploy hook that pulls latest code and restarts services.
* Chat-style dispatcher so operators can issue natural language commands
  like "Push latest to BlackRoad.io".

This script is a scaffold. Real credentials, OAuth flows and webhook
implementations must be filled in for production use.
"""
import argparse
import os
import shlex
import subprocess
import sys
from pathlib import Path


def run(cmd, cwd=None, check=True):
    """Run a shell command and return its stdout."""
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and proc.returncode != 0:
        raise RuntimeError(f"$ {' '.join(cmd)}\n{proc.stdout}\n{proc.stderr}")
    return proc.stdout.strip()


# --- GitHub helpers -------------------------------------------------------

def github_push(message="codex update"):
    """Commit and push local changes with a default message."""
    try:
        run("git add -A")
        run(f"git commit -m {shlex.quote(message)}", check=False)
        run("git pull --rebase", check=False)
        run("git push")
    except Exception as exc:
        print(f"GitHub sync failed: {exc}")
        raise


# --- Connector stubs -----------------------------------------------------

def sync_connectors():
    """Placeholder for syncing external connectors."""
    for name in ("Salesforce", "Airtable", "Slack", "Linear"):
        print(f"[connector] {name} sync: ok (stub)")


# --- Working Copy automation --------------------------------------------

def refresh_working_copy(path: Path):
    """Run git pull/push in an iOS Working Copy repo."""
    run("git pull", cwd=path)
    run("git push", cwd=path)


# --- Droplet deployment --------------------------------------------------

def deploy_droplet(host: str, repo_path: str):
    """Pull latest code on the droplet and restart services."""
    cmd = (
        f"ssh {host} 'cd {repo_path} && git pull && npm install --omit=dev && "
        "npm run migrate && systemctl restart blackroad-api.service'"
    )
    run(cmd, check=False)


# --- Chat dispatcher -----------------------------------------------------

def dispatch(command: str) -> int:
    """Map high level commands to pipeline actions."""
    c = command.lower()
    if "push" in c and "blackroad.io" in c:
        github_push()
        refresh_working_copy(Path(os.environ.get("WORKING_COPY_PATH", "/srv/working-copy")))
        deploy_droplet(
            os.environ.get("DROPLET_HOST", "root@droplet"),
            os.environ.get("DROPLET_REPO", "/srv/blackroad"),
        )
        sync_connectors()
    elif "refresh working copy" in c and "redeploy" in c:
        refresh_working_copy(Path(os.environ.get("WORKING_COPY_PATH", "/srv/working-copy")))
        deploy_droplet(
            os.environ.get("DROPLET_HOST", "root@droplet"),
            os.environ.get("DROPLET_REPO", "/srv/blackroad"),
        )
    elif "rebase" in c and "update" in c:
        run("git pull --rebase", check=False)
        github_push("codex rebase")
        deploy_droplet(
            os.environ.get("DROPLET_HOST", "root@droplet"),
            os.environ.get("DROPLET_REPO", "/srv/blackroad"),
        )
    elif "sync salesforce" in c:
        sync_connectors()
        deploy_droplet(
            os.environ.get("DROPLET_HOST", "root@droplet"),
            os.environ.get("DROPLET_REPO", "/srv/blackroad"),
        )
    else:
        print(f"Unknown command: {command}")
        return 1
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Codex end-to-end pipeline scaffold")
    ap.add_argument("command", help="natural language command to execute")
    args = ap.parse_args(argv)
    sys.exit(dispatch(args.command))


if __name__ == "__main__":
    main()
