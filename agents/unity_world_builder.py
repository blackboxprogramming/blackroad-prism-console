"""Utility for generating Unity-ready world archives via the exporter worker.

The BlackRoad Unity exporter already ships a rich Node.js implementation that can
stitch together a starter project. This CLI wraps the exporter so that agents –
and humans – can produce curated world seeds without leaving the command bus.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import textwrap
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List

REPO_ROOT = Path(__file__).resolve().parent.parent
UNITY_WORKER_DIR = REPO_ROOT / "workers" / "unity"
EXPORTER_MODULE = UNITY_WORKER_DIR / "src" / "exporter.js"


@dataclass
class UnityWorldBuildConfig:
    """Container for exporter inputs."""

    project_name: str = "BlackRoad World Seed"
    scene_name: str = "WorldPrototype"
    description: str = (
        "Curiosity-driven exploration space scaffolded for BlackRoad worlds."
    )
    author: str = "World Builder Agent"
    script_name: str | None = None
    namespace: str | None = "BlackRoad.Worlds"
    project_version: str | None = "2022.3.29f1"
    output_dir: Path = field(default_factory=lambda: REPO_ROOT / "downloads" / "unity")
    zip_name: str | None = None

    def to_payload(self) -> Dict[str, Any]:
        """Translate configuration into the JSON payload consumed by Node."""

        payload: Dict[str, Any] = {
            "projectName": self.project_name,
            "sceneName": self.scene_name,
            "description": self.description,
            "author": self.author,
            "outputDir": str(self.output_dir),
        }
        if self.script_name:
            payload["scriptName"] = self.script_name
        if self.namespace:
            payload["namespace"] = self.namespace
        if self.project_version:
            payload["projectVersion"] = self.project_version
        if self.zip_name:
            payload["zipFileName"] = self.zip_name
        return payload


@dataclass
class UnityWorldBuildResult:
    """Normalized response from the exporter."""

    zip_path: Path
    project_folder: str
    bytes: int
    files: List[str]
    metadata: Dict[str, Any]

    @classmethod
    def from_payload(cls, payload: Dict[str, Any]) -> "UnityWorldBuildResult":
        return cls(
            zip_path=Path(payload["zipPath"]),
            project_folder=str(payload["projectFolder"]),
            bytes=int(payload["bytes"]),
            files=list(payload.get("files", [])),
            metadata=dict(payload.get("metadata", {})),
        )


def ensure_environment() -> None:
    """Validate that the exporter prerequisites exist before we run anything."""

    if shutil.which("node") is None:
        raise RuntimeError("Node.js is required to build Unity worlds.")
    if not EXPORTER_MODULE.exists():
        raise FileNotFoundError(
            "Unity exporter not found; expected workers/unity/src/exporter.js"
        )


def _parse_json_lines(blob: str) -> Dict[str, Any]:
    """Extract the last JSON object emitted by the Node subprocess."""

    for line in reversed(blob.strip().splitlines()):
        line = line.strip()
        if not line:
            continue
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            continue
    raise ValueError("Node exporter did not return JSON output.")


def run_exporter(config: UnityWorldBuildConfig) -> UnityWorldBuildResult:
    """Invoke the Node exporter and capture its structured response."""

    ensure_environment()
    payload = config.to_payload()
    exporter_uri = EXPORTER_MODULE.resolve().as_uri()
    node_script = textwrap.dedent(
        f"""
        const {{ exportUnityProject }} = await import('{exporter_uri}');
        const payload = {json.dumps(payload)};
        try {{
          const result = await exportUnityProject(payload);
          console.log(JSON.stringify({{'status':'ok','result':result}}));
        }} catch (error) {{
          const message = error?.message || String(error);
          console.error(JSON.stringify({{'status':'error','message':message}}));
          process.exit(1);
        }}
        """
    )
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", node_script],
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        try:
            error_payload = _parse_json_lines(completed.stderr or completed.stdout)
        except ValueError as exc:  # pragma: no cover - defensive branch
            raise RuntimeError(
                f"Unity exporter failed: {completed.stderr or completed.stdout}"
            ) from exc
        raise RuntimeError(error_payload.get("message", "Unity exporter failed."))

    success_payload = _parse_json_lines(completed.stdout)
    if success_payload.get("status") != "ok":  # pragma: no cover - defensive branch
        raise RuntimeError("Unity exporter returned an unexpected payload.")

    return UnityWorldBuildResult.from_payload(success_payload["result"])


def _default_script_name(project_name: str) -> str:
    slug = "".join(ch if ch.isalnum() else " " for ch in project_name).title()
    condensed = slug.replace(" ", "")
    return condensed + "Controller" if condensed else "WorldController"


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Unity world archives using the BlackRoad exporter."
    )
    parser.add_argument(
        "--project-name",
        default="BlackRoad World Seed",
        help="Project title used for the Unity folder and metadata.",
    )
    parser.add_argument(
        "--scene-name",
        default="WorldPrototype",
        help="Primary scene name created under Assets/Scenes.",
    )
    parser.add_argument(
        "--script-name",
        default=None,
        help="Optional C# behaviour name. Defaults to <ProjectName>Controller.",
    )
    parser.add_argument(
        "--description",
        default="Curiosity-driven exploration space scaffolded for BlackRoad worlds.",
        help="Short description stored in README and metadata.",
    )
    parser.add_argument(
        "--author",
        default="World Builder Agent",
        help="Author field embedded in the export metadata.",
    )
    parser.add_argument(
        "--namespace",
        default="BlackRoad.Worlds",
        help="C# namespace for generated scripts.",
    )
    parser.add_argument(
        "--project-version",
        default="2022.3.29f1",
        help="Unity editor version recorded in ProjectSettings.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(REPO_ROOT / "downloads" / "unity"),
        help="Directory where the zip archive will be placed.",
    )
    parser.add_argument(
        "--zip-name",
        default=None,
        help="Optional override for the generated zip file name.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON instead of a human summary.",
    )
    return parser.parse_args(argv)


def build_world_from_args(args: argparse.Namespace) -> UnityWorldBuildResult:
    script_name = args.script_name or _default_script_name(args.project_name)
    config = UnityWorldBuildConfig(
        project_name=args.project_name,
        scene_name=args.scene_name,
        script_name=script_name,
        description=args.description,
        author=args.author,
        namespace=args.namespace,
        project_version=args.project_version,
        output_dir=Path(args.output_dir).expanduser().resolve(),
        zip_name=args.zip_name,
    )
    return run_exporter(config)


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        result = build_world_from_args(args)
    except Exception as exc:  # pragma: no cover - CLI surface
        print(f"Unity world generation failed: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(
            json.dumps(
                {
                    "zipPath": str(result.zip_path),
                    "projectFolder": result.project_folder,
                    "bytes": result.bytes,
                    "files": result.files,
                    "metadata": result.metadata,
                },
                indent=2,
            )
        )
    else:
        print(f"Unity world archive ready: {result.zip_path}")
        print(f"Project folder: {result.project_folder}")
        print(f"File count: {len(result.files)}")
        preview = "\n".join(f"  - {path}" for path in result.files[:5])
        if preview:
            print("Key assets:\n" + preview)
        print("Metadata:")
        for key, value in result.metadata.items():
            print(f"  {key}: {value}")
    return 0


if __name__ == "__main__":  # pragma: no cover - script entry point
    raise SystemExit(main())
