#!/usr/bin/env python3
"""Send a friendly hello message to Slack via incoming webhook."""

from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error


def send_slack_message(message: str) -> None:
    webhook = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook:
        raise RuntimeError("SLACK_WEBHOOK_URL is not set")

    payload = json.dumps({"text": message}).encode("utf-8")
    request = urllib.request.Request(
        webhook,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status >= 400:
                raise RuntimeError(f"Slack webhook failed with status {response.status}")
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Slack webhook failed with status {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Slack webhook request failed: {exc.reason}") from exc


def main() -> None:
    message = os.getenv("SLACK_HELLO_MESSAGE", "hellooooo!")
    send_slack_message(message)
    print("sent slack hello")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover - entrypoint error reporting
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
