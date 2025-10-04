"""Aggregate results from all simulation variants for quick comparison."""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List

import yaml


@dataclass
class VariantMetrics:
    name: str
    engine: str
    status: str
    metrics: Dict[str, float]

    @property
    def normalized_runtime(self) -> float:
        baseline = max(self.metrics.get("runtime_seconds", 0.0), 1e-3)
        return baseline / max(self.metrics.get("stability_index", 1.0), 1e-3)


@dataclass
class ComparisonSummary:
    manifest_path: Path
    rows: List[VariantMetrics]

    def to_dict(self) -> Dict[str, object]:
        return {
            "manifest": str(self.manifest_path),
            "variants": [
                {
                    "name": row.name,
                    "engine": row.engine,
                    "status": row.status,
                    "metrics": row.metrics,
                    "normalized_runtime": row.normalized_runtime,
                }
                for row in self.rows
            ],
        }


def load_manifest(outputs_dir: Path) -> Dict[str, object]:
    manifest_path = outputs_dir / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Manifest {manifest_path} is missing. Ensure run_variants.py has been executed first."
        )
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def load_variants_config(variants_file: Path) -> Dict[str, Dict[str, object]]:
    payload = yaml.safe_load(variants_file.read_text(encoding="utf-8"))
    mapping: Dict[str, Dict[str, object]] = {}
    for entry in payload.get("variants", []):
        mapping[entry["name"]] = entry
    return mapping


def load_metrics(outputs_dir: Path, manifest: Dict[str, object]) -> Iterable[VariantMetrics]:
    for item in manifest.get("results", []):
        variant = item.get("variant", {})
        name = variant.get("name")
        if not name:
            continue
        metrics_path = outputs_dir / name / "metrics.json"
        metrics = {}
        if metrics_path.exists():
            metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        yield VariantMetrics(
            name=name,
            engine=str(variant.get("engine", "unknown")),
            status=str(item.get("status", "unknown")),
            metrics=metrics,
        )


def build_summary(outputs_dir: Path, variants_file: Path) -> ComparisonSummary:
    manifest = load_manifest(outputs_dir)
    variant_map = load_variants_config(variants_file)

    rows = list(load_metrics(outputs_dir, manifest))
    for row in rows:
        config = variant_map.get(row.name, {})
        row.metrics.setdefault("steps", config.get("parameters", {}).get("steps"))
    return ComparisonSummary(manifest_path=outputs_dir / "manifest.json", rows=rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare results across simulation variants")
    parser.add_argument("--outputs-dir", type=Path, default=Path(__file__).resolve().parents[1] / "outputs")
    parser.add_argument("--variants-file", type=Path, default=Path(__file__).resolve().parents[1] / "10_genesis" / "variants.yaml")
    parser.add_argument(
        "--comparison-path",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "reports" / "comparison.json",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.comparison_path.parent.mkdir(parents=True, exist_ok=True)
    summary = build_summary(args.outputs_dir, args.variants_file)
    args.comparison_path.write_text(json.dumps(summary.to_dict(), indent=2), encoding="utf-8")
    print(f"Comparison written to {args.comparison_path}")
    for row in summary.rows:
        print(f" - {row.name} ({row.engine}): normalized_runtime={row.normalized_runtime:.3f}")


if __name__ == "__main__":
    main()
