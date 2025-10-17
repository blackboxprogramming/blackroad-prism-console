#!/usr/bin/env python3
"""Execute YAML-defined MQTT scenes from the Mac agent."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import time
from pathlib import Path
from typing import Iterable, Optional

try:  # pragma: no cover - import-time path fix for direct execution
    if __package__ in {None, ""}:  # type: ignore[name-defined]
        THIS_FILE = Path(__file__).resolve()
        PROJECT_ROOT = THIS_FILE.parents[2]
        if str(PROJECT_ROOT) not in sys.path:
            sys.path.insert(0, str(PROJECT_ROOT))
        from agent.mac.mqtt import publish_payload
        from agent.mac.scene_models import Scene, SceneStep, SceneValidationError, load_scene
    else:
        from agent.mac.mqtt import publish_payload
        from agent.mac.scene_models import Scene, SceneStep, SceneValidationError, load_scene
except ImportError as exc:  # pragma: no cover - runtime import guard
    raise SystemExit(f"Unable to import MQTT helpers: {exc}") from exc


def _format_step(step: SceneStep) -> str:
    label = f" – {step.label}" if step.label else ""
    delay = f", delay={step.delay:.2f}s" if step.delay else ""
    wait = f", wait={step.wait:.2f}s" if step.wait else ""
    return f"Step {step.index}: topic='{step.topic}'{label}{delay}{wait}"


def _publish_step(step: SceneStep, *, dry_run: bool) -> None:
    envelope = {"topic": step.topic, "payload": step.payload}
    if dry_run:
        print(f"[dry-run] {_format_step(step)}")
        print(json.dumps(envelope, indent=2, ensure_ascii=False))
        return
    print(f"Publishing {_format_step(step)}")
    publish_payload(step.topic, step.payload)


def _play_scene(scene: Scene, *, dry_run: bool) -> None:
    for step in scene.steps:
        if step.delay:
            time.sleep(step.delay)
        _publish_step(step, dry_run=dry_run)
        if step.wait:
            time.sleep(step.wait)


def _seconds_until_minute(minute: int) -> float:
    now = dt.datetime.now()
    next_run = now.replace(second=0, microsecond=0)
    if now.minute >= minute:
        next_run += dt.timedelta(hours=1)
    next_run = next_run.replace(minute=minute)
    return max((next_run - now).total_seconds(), 0.0)


def _run_with_hourly_schedule(scene: Scene, *, minute: int, dry_run: bool, run_now: bool) -> None:
    if run_now:
        print(f"Running '{scene.name}' immediately before entering hourly schedule")
        _play_scene(scene, dry_run=dry_run)
    while True:
        sleep_for = _seconds_until_minute(minute)
        if sleep_for:
            target = dt.datetime.now() + dt.timedelta(seconds=sleep_for)
            print(f"Waiting {sleep_for:.1f}s for next run at {target.strftime('%H:%M:%S')}")
            time.sleep(sleep_for)
        print(f"Starting scheduled run for '{scene.name}' at {dt.datetime.now().isoformat(timespec='seconds')}")
        _play_scene(scene, dry_run=dry_run)


def _run_with_repeat(scene: Scene, *, interval: float, dry_run: bool) -> None:
    while True:
        start = time.monotonic()
        _play_scene(scene, dry_run=dry_run)
        elapsed = time.monotonic() - start
        sleep_for = max(interval - elapsed, 0.0)
        if sleep_for:
            print(f"Sleeping {sleep_for:.2f}s before repeating scene")
            time.sleep(sleep_for)


def run_scene(
    path: Path,
    *,
    dry_run: bool = False,
    repeat: Optional[float] = None,
    hourly_minute: Optional[int] = None,
    run_now: bool = False,
) -> None:
    """Load and execute a scene using the requested scheduling mode."""

    scene = load_scene(path)
    print(f"Loaded scene '{scene.name}' from {path} with {len(scene.steps)} steps")

    if repeat is not None and hourly_minute is not None:
        raise SceneValidationError("Choose either --repeat or --hourly-minute, not both")

    if hourly_minute is not None:
        _run_with_hourly_schedule(scene, minute=hourly_minute, dry_run=dry_run, run_now=run_now)
        return

    _play_scene(scene, dry_run=dry_run)

    if repeat is not None:
        if repeat <= 0:
            raise SceneValidationError("Repeat interval must be greater than zero")
        print(f"Entering repeat loop every {repeat:.2f}s")
        _run_with_repeat(scene, interval=repeat, dry_run=dry_run)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Play a YAML-defined MQTT scene")
    parser.add_argument("scene", type=Path, help="Path to the YAML scene file")
    parser.add_argument("--dry", action="store_true", help="Print envelopes instead of publishing")
    parser.add_argument(
        "--repeat",
        type=float,
        help="Repeat the scene every N seconds (cannot be combined with --hourly-minute)",
    )
    parser.add_argument(
        "--hourly-minute",
        type=int,
        choices=range(60),
        help="Run the scene when the system clock reaches this minute each hour",
    )
    parser.add_argument(
        "--run-now",
        action="store_true",
        help="Execute the scene immediately before starting the hourly schedule",
    )
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    try:
        run_scene(
            args.scene,
            dry_run=args.dry,
            repeat=args.repeat,
            hourly_minute=args.hourly_minute,
            run_now=args.run_now,
        )
    except SceneValidationError as exc:
        parser.error(str(exc))
    except KeyboardInterrupt:
        print("\nInterrupted")
        return 130
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())
