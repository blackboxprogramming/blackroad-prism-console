"""Validation helper for the universal simulation starter pipeline."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Iterable

import yaml


class PipelineError(RuntimeError):
    """Raised when the simulation pipeline fails validation."""


def load_variants(variants_file: Path) -> Iterable[str]:
    payload = yaml.safe_load(variants_file.read_text(encoding="utf-8"))
    for entry in payload.get("variants", []):
        yield entry["name"]


def validate_manifest(outputs_dir: Path, expected_variants: Iterable[str]) -> Dict[str, object]:
    manifest_path = outputs_dir / "manifest.json"
    if not manifest_path.exists():
        raise PipelineError(f"Missing manifest at {manifest_path}. Run the genesis stage first.")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    observed = {item.get("variant", {}).get("name") for item in manifest.get("results", [])}
    missing = [variant for variant in expected_variants if variant not in observed]
    if missing:
        raise PipelineError(f"Manifest missing entries for: {', '.join(missing)}")
    return manifest


def validate_variant(outputs_dir: Path, variant: str) -> None:
    variant_dir = outputs_dir / variant
    if not variant_dir.exists():
        raise PipelineError(f"Output directory for variant '{variant}' is missing at {variant_dir}")

    for filename in ("metadata.json", "metrics.json", "summary.txt"):
        file_path = variant_dir / filename
        if not file_path.exists():
            raise PipelineError(f"Expected artifact {file_path} not found")

    metrics = json.loads((variant_dir / "metrics.json").read_text(encoding="utf-8"))
    required_fields = {"runtime_seconds", "peak_memory_mb", "stability_index", "energy_retention"}
    missing_fields = sorted(required_fields - metrics.keys())
    if missing_fields:
        raise PipelineError(f"Variant '{variant}' is missing metrics: {', '.join(missing_fields)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate simulation pipeline outputs")
    parser.add_argument("--variants-file", type=Path, required=True)
    parser.add_argument("--outputs-dir", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    expected_variants = list(load_variants(args.variants_file))
    manifest = validate_manifest(args.outputs_dir, expected_variants)

    for variant in expected_variants:
        validate_variant(args.outputs_dir, variant)

    print(f"Validated {len(expected_variants)} variant outputs against manifest {args.outputs_dir / 'manifest.json'}")
    for item in manifest.get("results", []):
        print(f" - {item.get('variant', {}).get('name')}: {item.get('status')}")


if __name__ == "__main__":
    try:
        main()
    except PipelineError as exc:
        print(f"Pipeline validation failed: {exc}")
        raise SystemExit(1)
