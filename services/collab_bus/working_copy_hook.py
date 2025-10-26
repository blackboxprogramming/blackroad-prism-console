"""Working Copy automation hook for emitting bus telemetry.

The script is designed to be invoked by Working Copy's automation feature
(https://workingcopyapp.com/automation). It sends a lightweight heartbeat and
focus payload to the collaboration presence bus so mobile contributors show up
next to desktop agents.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

from .client import CollabBusClient


def main() -> None:
    parser = argparse.ArgumentParser(description="Working Copy presence hook")
    parser.add_argument("--agent", default=os.environ.get("COLLAB_AGENT", "working-copy"))
    parser.add_argument("--file", default="")
    parser.add_argument("--branch", default=os.environ.get("GIT_BRANCH"))
    parser.add_argument("--bus", default=os.environ.get("COLLAB_BUS_URL", "http://127.0.0.1:9000"))
    args = parser.parse_args()

    client = CollabBusClient(base_url=args.bus, agent=args.agent)
    client.connect()
    focus_path = Path(args.file) if args.file else None
    if focus_path and focus_path.exists():
        client.focus(str(focus_path), branch=args.branch)
    else:
        client.heartbeat(branch=args.branch)


if __name__ == "__main__":  # pragma: no cover
    main()
