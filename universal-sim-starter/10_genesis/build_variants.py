"""Utility for preparing baseline + variant Genesis prompt directories."""

from __future__ import annotations

import argparse
import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import yaml


def load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError("Variant specification must be a mapping")
    return data


def merge_dicts(base: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    """Return a deep copy of *base* with *overrides* applied recursively."""

    result: Dict[str, Any] = deepcopy(base)
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge_dicts(result[key], value)  # type: ignore[arg-type]
        else:
            result[key] = value
    return result


def write_prompt(destination: Path, prompt: str) -> None:
    destination.write_text(prompt.rstrip() + "\n", encoding="utf-8")


def write_config(destination: Path, config: Dict[str, Any]) -> None:
    with destination.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(config, handle, sort_keys=False)


def write_metadata(destination: Path, payload: Dict[str, Any]) -> None:
    with destination.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)


def copy_artifacts(source_dir: Path, target_dir: Path) -> bool:
    if not source_dir.exists():
        return False
    copied = False
    target_dir.mkdir(parents=True, exist_ok=True)
    for item in source_dir.iterdir():
        if item.is_file():
            copied = True
            target = target_dir / item.name
            target.write_bytes(item.read_bytes())
        elif item.is_dir():
            copied = copy_artifacts(item, target_dir / item.name) or copied
    return copied


def prepare_variant(
    variant: Dict[str, Any],
    base_prompt: str,
    base_config: Dict[str, Any],
    outputs_root: Path,
    artifacts_root: Path,
) -> Dict[str, Any]:
    name = variant.get("name")
    if not isinstance(name, str) or not name:
        raise ValueError("Each variant must define a non-empty 'name'")

    description = variant.get("description", "")
    prompt_suffix = variant.get("prompt_suffix", "")
    config_overrides = variant.get("config_overrides", {})
    if prompt_suffix:
        prompt_text = base_prompt.rstrip() + "\n\n" + str(prompt_suffix).strip() + "\n"
    else:
        prompt_text = base_prompt

    config = merge_dicts(base_config, config_overrides if isinstance(config_overrides, dict) else {})

    output_dir = outputs_root / f"outputs_{name}"
    output_dir.mkdir(parents=True, exist_ok=True)

    prompt_path = output_dir / "prompt.txt"
    config_path = output_dir / "config.yaml"
    write_prompt(prompt_path, prompt_text)
    write_config(config_path, config)

    base_rel = outputs_root.parent
    metadata = {
        "variant": name,
        "description": description,
        "prompt_file": str(prompt_path.relative_to(base_rel)),
        "config_file": str(config_path.relative_to(base_rel)),
        "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "source_prompt": str((outputs_root / "prompt.txt").relative_to(base_rel)),
        "source_config": str((outputs_root / "config.yaml").relative_to(base_rel)),
    }
    write_metadata(output_dir / "run_meta.json", metadata)

    variant_artifacts_root = artifacts_root / "variants" / name
    solid_copied = copy_artifacts(artifacts_root / "solid", variant_artifacts_root / "solid")
    fluid_copied = copy_artifacts(artifacts_root / "fluid", variant_artifacts_root / "fluid")

    metadata["artifacts"] = {
        "solid": str((variant_artifacts_root / "solid").relative_to(base_rel)),
        "fluid": str((variant_artifacts_root / "fluid").relative_to(base_rel)),
        "copied_from_baseline": bool(solid_copied or fluid_copied),
    }
    write_metadata(output_dir / "run_meta.json", metadata)

    return {
        "name": name,
        "description": description,
        "prompt": str(prompt_path),
        "config": str(config_path),
        "artifacts": variant_artifacts_root,
    }


def prepare_baseline(outputs_root: Path, base_prompt: str, base_config: Dict[str, Any]) -> None:
    baseline_dir = outputs_root / "outputs_baseline"
    baseline_dir.mkdir(parents=True, exist_ok=True)
    write_prompt(baseline_dir / "prompt.txt", base_prompt)
    write_config(baseline_dir / "config.yaml", base_config)
    base_rel = outputs_root.parent
    write_metadata(
        baseline_dir / "run_meta.json",
        {
            "variant": "baseline",
            "description": "Canonical Genesis setup used as the comparison reference.",
            "prompt_file": str((baseline_dir / "prompt.txt").relative_to(base_rel)),
            "config_file": str((baseline_dir / "config.yaml").relative_to(base_rel)),
            "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "source_prompt": str((outputs_root / "prompt.txt").relative_to(base_rel)),
            "source_config": str((outputs_root / "config.yaml").relative_to(base_rel)),
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Genesis baseline and variant directories.")
    parser.add_argument(
        "--genesis-dir",
        type=Path,
        default=Path(__file__).parent,
        help="Directory containing baseline Genesis prompt/config.",
    )
    parser.add_argument(
        "--artifacts",
        type=Path,
        default=Path(__file__).parent.parent / "artifacts",
        help="Root directory for simulation artifacts.",
    )
    parser.add_argument(
        "--spec",
        type=Path,
        default=Path(__file__).with_name("variants.yaml"),
        help="YAML file describing Genesis prompt variants.",
    )
    args = parser.parse_args()

    base_prompt = (args.genesis_dir / "prompt.txt").read_text(encoding="utf-8")
    with (args.genesis_dir / "config.yaml").open("r", encoding="utf-8") as handle:
        base_config = yaml.safe_load(handle) or {}

    outputs_root = args.genesis_dir
    prepare_baseline(outputs_root, base_prompt, base_config)

    spec = load_yaml(args.spec)
    variants = spec.get("variants", [])
    if not isinstance(variants, list):
        raise ValueError("The 'variants' key must contain a list")

    prepared = []
    for variant in variants:
        if not isinstance(variant, dict):
            raise ValueError("Each variant entry must be a mapping")
        prepared.append(prepare_variant(variant, base_prompt, base_config, outputs_root, args.artifacts))

    if prepared:
        print(f"Prepared {len(prepared)} Genesis variants: {', '.join(v['name'] for v in prepared)}")
    else:
        print("No variants defined; only baseline directory refreshed.")


if __name__ == "__main__":
    main()
