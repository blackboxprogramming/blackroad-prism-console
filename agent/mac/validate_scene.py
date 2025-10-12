#!/usr/bin/env python3
"""Validate YAML scene definitions."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

try:  # pragma: no cover - import-time path fix for direct execution
    if __package__ in {None, ""}:  # type: ignore[name-defined]
        THIS_FILE = Path(__file__).resolve()
        PROJECT_ROOT = THIS_FILE.parents[2]
        if str(PROJECT_ROOT) not in sys.path:
            sys.path.insert(0, str(PROJECT_ROOT))
        from agent.mac.scene_models import SceneValidationError, load_scene
    else:
        from agent.mac.scene_models import SceneValidationError, load_scene
except ImportError as exc:  # pragma: no cover - runtime import guard
    raise SystemExit(f"Unable to import scene utilities: {exc}") from exc


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate YAML scene definitions")
    parser.add_argument("scenes", nargs="+", type=Path, help="Scene file(s) to validate")
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    status = 0
    for scene_path in args.scenes:
        try:
            scene = load_scene(scene_path)
        except SceneValidationError as exc:
            status = 1
            print(f"[FAIL] {scene_path}: {exc}")
            continue
        print(f"[ OK ] {scene_path} — '{scene.name}' with {len(scene.steps)} step(s)")
    return status


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())
