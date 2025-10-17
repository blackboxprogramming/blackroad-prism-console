#!/usr/bin/env python3
"""Publish Pi-Holo audio playback commands over MQTT."""
from __future__ import annotations

import argparse
import os
from typing import Any

from agent.mac.mqtt import publish_payload


def parse_loop(value: str) -> bool:
    lowered = value.strip().lower()
    if lowered in {"1", "true", "yes", "loop"}:
        return True
    if lowered in {"0", "false", "no", "stop"}:
        return False
    raise argparse.ArgumentTypeError(f"invalid loop flag: {value}")


def clamp_volume(value: float) -> float:
    return max(0.0, min(1.0, value))


def build_payload(args: argparse.Namespace) -> dict[str, Any]:
    if args.stop:
        return {"stop": True}

    payload: dict[str, Any] = {
        "file": args.file,
        "volume": clamp_volume(args.volume),
    }
    if args.loop:
        payload["loop"] = True
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Send an audio command to the Pi-Holo listener")
    parser.add_argument("file", nargs="?", help="Sound file name relative to the Pi sounds directory")
    parser.add_argument("volume", nargs="?", type=float, default=0.8, help="Playback volume between 0 and 1")
    parser.add_argument("loop", nargs="?", type=parse_loop, default=False, help="Loop flag (0 or 1)")
    parser.add_argument("--topic", default=os.getenv("AUDIO_TOPIC", "holo/audio"), help="MQTT topic (default: %(default)s)")
    parser.add_argument("--stop", action="store_true", help="Send a stop payload instead of play")
    args = parser.parse_args()

    if not args.stop and not args.file:
        parser.error("file argument is required unless --stop is used")

    payload = build_payload(args)
    publish_payload(args.topic, payload)

    if args.stop:
        print(f"Published stop command to {args.topic}")
    else:
        loop_label = "looping" if args.loop else "once"
        print(
            f"Published {payload['file']} at volume {payload['volume']:.2f} ({loop_label}) to {args.topic}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
