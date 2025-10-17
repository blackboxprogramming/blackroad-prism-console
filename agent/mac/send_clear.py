#!/usr/bin/env python3
"""Send a clear command to the Pi-Holo renderer."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def send_command(base_url: str, device: str, token: str, payload: dict[str, object]) -> None:
    url = base_url.rstrip("/") + f"/api/devices/{device}/commands"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-BlackRoad-Key"] = token
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        resp.read()


def main() -> int:
    parser = argparse.ArgumentParser(description="Blank the Pi-Holo display via the backplane")
    parser.add_argument(
        "--base-url",
        default=os.getenv("BACKPLANE_URL", "http://pi-holo.local:4000"),
        help="Backplane base URL (default: %(default)s)",
    )
    parser.add_argument(
        "--device",
        default=os.getenv("HOLO_DEVICE_ID", "pi-holo"),
        help="Device identifier (default: %(default)s)",
    )
    parser.add_argument(
        "--token",
        default=os.getenv("BR_KEY", ""),
        help="Backplane authentication token (default: value from BR_KEY)",
    )
    parser.add_argument(
        "--view-only",
        action="store_true",
        help="Send only view='clear' without forcing mode=clear",
    )
    args = parser.parse_args()

    payload: dict[str, object] = {"type": "holo.view", "view": "clear"}
    if not args.view_only:
        payload["mode"] = "clear"

    try:
        send_command(args.base_url, args.device, args.token, payload)
    except urllib.error.HTTPError as exc:
        sys.stderr.write(f"Request failed: HTTP {exc.code}\n")
        return 2
    except Exception as exc:  # pragma: no cover - network errors at runtime only
        sys.stderr.write(f"Request failed: {exc}\n")
        return 1

    print(f"Sent clear command to {args.device} via {args.base_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
