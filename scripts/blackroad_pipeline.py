#!/usr/bin/env python3
"""Chat-first control surface for the BlackRoad.io pipeline."""
from __future__ import annotations

import argparse

from codex.blackroad_pipeline import BlackRoadPipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Operate the BlackRoad.io pipeline")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("push", help="Push latest changes to GitHub")
    sub.add_parser("refresh", help="Refresh working copy and redeploy")
    rebase = sub.add_parser("rebase", help="Rebase branch and update site")
    rebase.add_argument("branch", help="Branch to rebase onto")
    sub.add_parser("sync", help="Sync external connectors")
    args = parser.parse_args()

    pipeline = BlackRoadPipeline()
    if args.cmd == "push":
        pipeline.push_latest()
    elif args.cmd == "refresh":
        pipeline.refresh_working_copy()
    elif args.cmd == "rebase":
        pipeline.rebase_branch(args.branch)
    elif args.cmd == "sync":
        pipeline.sync_connectors()


if __name__ == "__main__":
    main()
