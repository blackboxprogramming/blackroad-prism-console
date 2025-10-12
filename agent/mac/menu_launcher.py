#!/usr/bin/env python3
"""Menu bar launcher for running YAML scenes on macOS."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Dict, Iterable, List

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

try:  # pragma: no cover - optional dependency for macOS menu bar apps
    import rumps
except ImportError:  # pragma: no cover - optional dependency for macOS menu bar apps
    rumps = None  # type: ignore


if rumps is not None:  # pragma: no cover - only defined when dependency is present

    class SceneMenuApp(rumps.App):  # type: ignore[misc]
        """Menu bar application that triggers scene playback."""

        def __init__(self, scenes: Dict[str, Path], runner: Path) -> None:
            super().__init__("Scenes")
            self._runner = runner
            items = []
            for title, path in sorted(scenes.items()):
                items.append(rumps.MenuItem(title, callback=self._make_callback(path)))
            if items:
                items.append(rumps.separator)
            items.append(rumps.MenuItem("Quit", callback=self._quit))
            self.menu = items

        def _make_callback(self, scene_path: Path):  # type: ignore[override]
            def _callback(_):
                rumps.notification("Scene", scene_path.name, "Running…")
                subprocess.Popen([sys.executable, str(self._runner), str(scene_path)])

            return _callback

        def _quit(self, _):  # type: ignore[override]
            rumps.quit_application()


def _discover_scenes(paths: List[Path]) -> Dict[str, Path]:
    scenes: Dict[str, Path] = {}
    for path in paths:
        if path.is_dir():
            for candidate in sorted(path.glob("*.yaml")):
                _register_scene(candidate, scenes)
        else:
            _register_scene(path, scenes)
    return scenes


def _register_scene(path: Path, scenes: Dict[str, Path]) -> None:
    try:
        scene = load_scene(path)
    except SceneValidationError as exc:
        raise SystemExit(f"Invalid scene '{path}': {exc}") from exc
    title = scene.name
    suffix = 1
    while title in scenes:
        suffix += 1
        title = f"{scene.name} ({suffix})"
    scenes[title] = path


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="macOS menu bar launcher for scenes")
    parser.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="Scene files or directories to expose in the menu",
    )
    parser.add_argument(
        "--runner",
        type=Path,
        default=Path(__file__).with_name("scene_runner.py"),
        help="Path to scene_runner.py (defaults to sibling script)",
    )
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    if rumps is None:  # pragma: no cover - optional dependency guard
        raise SystemExit(
            "The 'rumps' package is required for the menu bar app. Install it via `pip install rumps`."
        )
    parser = _build_parser()
    args = parser.parse_args(argv)
    scenes = _discover_scenes([path.expanduser() for path in args.paths])
    if not scenes:
        raise SystemExit("No valid scenes found")
    runner = args.runner.expanduser()
    if not runner.exists():
        raise SystemExit(f"Scene runner not found at {runner}")
    app = SceneMenuApp(scenes, runner)
    app.run()
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())
