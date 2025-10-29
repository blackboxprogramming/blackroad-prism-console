#!/usr/bin/env python3
"""Bootstrap the Prism Console consent ledger with an invitee acknowledgement.

This script appends a structured `invitee_ack` event to the consent ledger
(`data/privacy/consent.jsonl`). The event binds the collaborating subject,
service identifier, and bootstrap session into the audit trail described in
Section 10 of the Prism Console blueprint.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
import sys
import time
import uuid
from typing import Any, Dict

DEFAULT_LEDGER = Path("data/privacy/consent.jsonl")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Record the First Task Bootstrap consent acknowledgement"
    )
    parser.add_argument(
        "--subject",
        required=True,
        help="Stable identifier for the consenting subject (e.g. agent:gemmy)",
    )
    parser.add_argument(
        "--service-id",
        required=True,
        help="Logical service identifier that will own the ledger entry",
    )
    parser.add_argument(
        "--session",
        required=True,
        help="Bootstrap session or handshake identifier",
    )
    parser.add_argument(
        "--purpose",
        required=True,
        help="Purpose for which consent is being captured",
    )
    parser.add_argument(
        "--region",
        default="global",
        help="Region tag for data residency tracking",
    )
    parser.add_argument(
        "--channel",
        default="console",
        help="Interaction channel used to capture the acknowledgement",
    )
    parser.add_argument(
        "--metadata",
        help="Optional JSON string with additional context (stored verbatim)",
    )
    parser.add_argument(
        "--ledger",
        default=str(DEFAULT_LEDGER),
        help="Path to the consent ledger JSONL file",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the event without writing to disk",
    )
    return parser.parse_args()


def load_metadata(raw: str | None) -> Dict[str, Any] | None:
    if not raw:
        return None
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"metadata is not valid JSON: {exc}")
    if not isinstance(value, dict):
        raise SystemExit("metadata JSON must decode to an object")
    return value


def build_event(args: argparse.Namespace) -> Dict[str, Any]:
    now_ms = int(time.time() * 1000)
    event: Dict[str, Any] = {
        "eventId": f"evt_{uuid.uuid4().hex}",
        "event": "invitee_ack",
        "ts": now_ms,
        "recordedAt": datetime.now(timezone.utc).isoformat(),
        "subjectId": args.subject,
        "serviceId": args.service_id,
        "sessionId": args.session,
        "purpose": args.purpose,
        "channel": args.channel,
        "granted": True,
        "region": args.region,
    }
    metadata = load_metadata(args.metadata)
    if metadata:
        event["metadata"] = metadata
    return event


def append_event(event: Dict[str, Any], ledger_path: Path) -> None:
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with ledger_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, separators=(",", ":")))
        handle.write("\n")



def main() -> int:
    args = parse_args()
    event = build_event(args)
    if args.dry_run:
        json.dump(event, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0

    ledger_path = Path(args.ledger)
    append_event(event, ledger_path)
    print(
        "invitee_ack recorded",
        json.dumps(
            {
                "ledger": str(ledger_path),
                "eventId": event["eventId"],
                "subjectId": event["subjectId"],
                "serviceId": event["serviceId"],
            }
        ),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
