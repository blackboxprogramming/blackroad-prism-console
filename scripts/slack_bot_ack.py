#!/usr/bin/env python3
"""Helper to acknowledge Alertmanager alerts triggered from Slack interactions."""

from __future__ import annotations

import argparse
import datetime as dt
import getpass
import os
import sys
from typing import Sequence

import requests


def parse_duration(text: str) -> dt.timedelta:
    """Parse a duration string like ``30m`` or ``1h15m`` into ``timedelta``."""
    if not text:
        raise ValueError("Duration cannot be empty")

    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    total_seconds = 0
    number = []

    for char in text.strip():
        if char.isdigit():
            number.append(char)
            continue
        if char not in units:
            raise ValueError(f"Unsupported duration unit: {char}")
        if not number:
            raise ValueError("Duration value missing before unit")
        total_seconds += int("".join(number)) * units[char]
        number.clear()

    if number:
        total_seconds += int("".join(number))

    if total_seconds <= 0:
        raise ValueError("Duration must be positive")

    return dt.timedelta(seconds=total_seconds)


def create_silence(
    alertmanager_url: str,
    alertname: str,
    author: str,
    duration: dt.timedelta,
    comment: str,
) -> str:
    """Create an Alertmanager silence that acts as an acknowledgement."""
    now = dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc)
    payload = {
        "matchers": [
            {"name": "alertname", "value": alertname, "isRegex": False},
        ],
        "startsAt": now.isoformat(),
        "endsAt": (now + duration).isoformat(),
        "createdBy": author,
        "comment": comment,
    }

    url = alertmanager_url.rstrip("/") + "/api/v2/silences"

    auth = None
    username = os.getenv("ALERTMANAGER_USER")
    password = os.getenv("ALERTMANAGER_PASSWORD")
    if username and password:
        auth = (username, password)

    response = requests.post(url, json=payload, auth=auth, timeout=10)
    response.raise_for_status()
    data = response.json()
    silence_id = data.get("silenceID") or data.get("id")
    if not silence_id:
        raise RuntimeError("Alertmanager did not return a silence ID")
    return silence_id


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Acknowledge an alert by creating an Alertmanager silence.",
    )
    parser.add_argument("alertname", help="Exact alertname label to silence.")
    parser.add_argument(
        "--duration",
        default="1h",
        help="Silence duration (e.g. 30m, 2h, 1h30m). Defaults to 1h.",
    )
    parser.add_argument(
        "--author",
        default=os.getenv("SLACK_ACK_USER") or getpass.getuser(),
        help="Name recorded in Alertmanager. Defaults to $SLACK_ACK_USER or current user.",
    )
    parser.add_argument(
        "--comment",
        default=None,
        help="Optional acknowledgement comment to store with the silence.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    alertmanager_url = os.getenv("ALERTMANAGER_URL")
    if not alertmanager_url:
        parser.error("ALERTMANAGER_URL environment variable must be set")

    try:
        duration = parse_duration(args.duration)
    except ValueError as exc:
        parser.error(str(exc))

    comment = args.comment or f"Acknowledged via Slack by {args.author}"

    try:
        silence_id = create_silence(alertmanager_url, args.alertname, args.author, duration, comment)
    except requests.HTTPError as exc:
        print(f"Alertmanager responded with error: {exc.response.text}", file=sys.stderr)
        return 2
    except Exception as exc:  # pragma: no cover - CLI utility
        print(f"Failed to acknowledge alert: {exc}", file=sys.stderr)
        return 1

    print(f"Created silence {silence_id} for alert '{args.alertname}' lasting {args.duration}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
