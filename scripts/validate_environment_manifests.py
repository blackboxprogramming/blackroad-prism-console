#!/usr/bin/env python3
"""Validate environment manifests against the shared schema."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable, Tuple

try:
    import yaml
except ImportError as exc:  # pragma: no cover - handled via runtime error message
    raise SystemExit("pyyaml is required to load environment manifests") from exc

try:
    from jsonschema import Draft202012Validator
except ImportError as exc:  # pragma: no cover - handled via runtime error message
    raise SystemExit("jsonschema is required to validate environment manifests") from exc

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_DIR = REPO_ROOT / "environments"
SCHEMA_PATH = REPO_ROOT / "schemas" / "environment_manifest.schema.json"


def load_schema() -> Draft202012Validator:
    """Load the manifest schema and return a validator instance."""
    if not SCHEMA_PATH.exists():
        raise SystemExit(f"Schema not found: {SCHEMA_PATH}")

    schema = json.loads(SCHEMA_PATH.read_text())
    return Draft202012Validator(schema)


def iter_manifests(paths: Iterable[Path]) -> Iterable[Path]:
    """Yield manifest paths from the provided iterable, filtering by extension."""
    for path in paths:
        if path.is_file() and path.suffix in {".yml", ".yaml"}:
            yield path


def validate_manifest(path: Path, validator: Draft202012Validator) -> Tuple[bool, str]:
    """Validate a manifest file and return a tuple of (is_valid, message)."""
    try:
        data = yaml.safe_load(path.read_text()) or {}
    except yaml.YAMLError as exc:
        return False, f"Failed to parse YAML: {exc}"

    errors = sorted(validator.iter_errors(data), key=lambda error: error.path)
    if errors:
        details = "; ".join(f"{list(err.path) or ['<root>']} -> {err.message}" for err in errors)
        return False, details

    return True, "ok"


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help=(
            "Optional manifest files or directories to validate. Defaults to all "
            "files under environments/."
        ),
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    validator = load_schema()

    candidates: Iterable[Path]
    if args.paths:
        expanded: list[Path] = []
        for input_path in args.paths:
            if input_path.is_dir():
                expanded.extend(sorted(iter_manifests(input_path.glob("**/*"))))
            else:
                expanded.append(input_path)
        candidates = expanded
    else:
        candidates = sorted(iter_manifests(MANIFEST_DIR.glob("*.yml")))

    if not candidates:
        print("No manifest files found.", file=sys.stderr)
        return 1

    success = True
    for manifest_path in candidates:
        is_valid, message = validate_manifest(manifest_path, validator)
        status = "OK" if is_valid else "FAIL"
        print(f"[{status}] {manifest_path.relative_to(REPO_ROOT)} :: {message}")
        if not is_valid:
            success = False

    return 0 if success else 2


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    sys.exit(main())
