#!/usr/bin/env python3
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
"""
from __future__ import annotations

import argparse
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
