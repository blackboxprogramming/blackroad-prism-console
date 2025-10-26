"""Validate that a discussion occurred for a pull request before merge."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from services.collab_bus.storage import CollabStore


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ensure collaboration discussion logged in presence bus")
    parser.add_argument("--pr", type=int, required=True, help="Pull request number under review")
    parser.add_argument("--db", type=Path, default=Path("var/collab_bus.sqlite"))
    parser.add_argument("--subject", type=str, help="Override discussion subject name")
    parser.add_argument("--horizon", type=int, default=3 * 24 * 3600, help="Age window (seconds)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.db.exists():
        print(
            f"::error::Presence database {args.db} not found. "
            "Sync collab_bus status before merging."
        )
        return 1
    store = CollabStore(path=args.db)
    subject = args.subject or f"pr-{args.pr}"
    if store.has_discussion(subject, horizon_s=args.horizon):
        print(f"discussion found for {subject}")
        return 0
    print(
        f"::error::Presence bus audit log missing review discussion for {subject}. "
        "Ensure at least one agent + human conversation is recorded."
    )
    return 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
