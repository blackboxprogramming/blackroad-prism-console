"""Audit log validation helpers for CI pipelines."""

import argparse
import json
from pathlib import Path
from typing import Iterable, Iterator, Optional


def load_events(path: Path) -> Iterator[dict]:
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def maintenance_block_count(events: Iterable[dict]) -> int:
    return sum(1 for event in events if event.get("event") == "maintenance.block")


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate audit JSONL streams")
    parser.add_argument("--audit-log", type=Path, required=True, help="Path to the audit JSONL file")
    parser.add_argument(
        "--max-maintenance-blocks",
        type=int,
        default=2,
        help="Maximum allowed maintenance.block events before failing the build.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_args(argv)
    if not args.audit_log.exists():
        raise FileNotFoundError(f"Audit log {args.audit_log} does not exist")

    events = list(load_events(args.audit_log))
    blocks = maintenance_block_count(events)

    if blocks > args.max_maintenance_blocks:
        print(
            "::error::maintenance.block threshold exceeded",
            f"count={blocks}",
            f"threshold={args.max_maintenance_blocks}",
        )
        return 1

    print(
        "::notice::maintenance.block threshold ok",
        f"count={blocks}",
        f"threshold={args.max_maintenance_blocks}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
