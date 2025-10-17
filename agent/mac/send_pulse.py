#!/usr/bin/env python3
"""Trigger a pulse effect on the Pi-Holo renderer."""
from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict
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
    parser = argparse.ArgumentParser(description="Trigger a Pi-Holo pulse effect")
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
    parser.add_argument("--duration", type=float, default=3.0, help="Pulse duration in seconds")
    parser.add_argument("--speed", type=float, default=1.0, help="Pulse oscillation speed multiplier")
    parser.add_argument(
        "--intensity",
        type=float,
        default=1.0,
        help="Pulse brightness multiplier between 0 and 1",
    )
    args = parser.parse_args()

    effect: Dict[str, Any] = {
        "type": "pulse",
        "duration": max(0.1, args.duration),
        "speed": max(0.05, args.speed),
        "intensity": max(0.0, min(1.0, args.intensity)),
    }

    payload: dict[str, object] = {
        "type": "holo.effect",
        "mode": "effect",
        "effect": effect,
        "ttl_s": max(args.duration, 0.1),
    }

    try:
        send_command(args.base_url, args.device, args.token, payload)
    except urllib.error.HTTPError as exc:
        sys.stderr.write(f"Request failed: HTTP {exc.code}\n")
        return 2
    except Exception as exc:  # pragma: no cover - runtime network errors only
        sys.stderr.write(f"Request failed: {exc}\n")
        return 1

    print(
        "Sent pulse command to {device} via {url} (duration={duration}s speed={speed} intensity={intensity})".format(
            device=args.device,
            url=args.base_url,
            duration=effect["duration"],
            speed=effect["speed"],
            intensity=effect["intensity"],
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
