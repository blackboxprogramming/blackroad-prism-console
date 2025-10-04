"""Generate a Markdown report summarizing simulation runs and comparisons."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Iterable, List

import yaml


def load_manifest(outputs_dir: Path) -> Dict[str, object]:
    manifest_path = outputs_dir / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Manifest {manifest_path} is missing. Execute run_variants.py before creating a report."
        )
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def load_variants(variants_file: Path) -> Dict[str, Dict[str, object]]:
    payload = yaml.safe_load(variants_file.read_text(encoding="utf-8"))
    return {entry["name"]: entry for entry in payload.get("variants", [])}


def iter_rows(outputs_dir: Path, manifest: Dict[str, object]) -> Iterable[Dict[str, object]]:
    for item in manifest.get("results", []):
        variant = item.get("variant", {})
        name = variant.get("name")
        if not name:
            continue
        metrics_path = outputs_dir / name / "metrics.json"
        metrics = {}
        if metrics_path.exists():
            metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        yield {
            "name": name,
            "engine": variant.get("engine", "unknown"),
            "status": item.get("status", "unknown"),
            "metrics": metrics,
            "notes": item.get("notes", []),
        }


def format_markdown(manifest: Dict[str, object], rows: List[Dict[str, object]], variants: Dict[str, Dict[str, object]]) -> str:
    header = ["# Universal Simulation Starter Report", ""]
    header.append(f"Generated: {manifest.get('generated_at', 'unknown')}")
    header.append("")
    header.append("## Variant Overview")
    header.append("")
    header.append("| Name | Engine | Status | Runtime (s) | Stability | Energy Retention |")
    header.append("| --- | --- | --- | ---: | ---: | ---: |")

    for row in rows:
        metrics = row.get("metrics", {})
        header.append(
            "| {name} | {engine} | {status} | {runtime:.3f} | {stability:.4f} | {energy:.3f} |".format(
                name=row.get("name", ""),
                engine=row.get("engine", ""),
                status=row.get("status", ""),
                runtime=float(metrics.get("runtime_seconds", 0.0)),
                stability=float(metrics.get("stability_index", 0.0)),
                energy=float(metrics.get("energy_retention", 0.0)),
            )
        )

    header.append("")
    header.append("## Detailed Notes")
    header.append("")

    for row in rows:
        header.append(f"### {row.get('name', 'Unnamed variant')}")
        header.append("")
        header.append(f"*Engine*: {row.get('engine', 'unknown')}  ")
        header.append(f"*Status*: {row.get('status', 'unknown')}  ")
        config = variants.get(row.get("name"), {}).get("description")
        if config:
            header.append(f"*Scenario*: {config}")
        metrics = row.get("metrics", {})
        if metrics:
            header.append("")
            header.append("**Metrics**")
            for key, value in metrics.items():
                header.append(f"- **{key}**: {value}")
        notes = row.get("notes", [])
        if notes:
            header.append("")
            header.append("**Notes**")
            for note in notes:
                header.append(f"- {note}")
        header.append("")

    return "\n".join(header) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a Markdown report for simulation results")
    parser.add_argument("--outputs-dir", type=Path, default=Path(__file__).resolve().parents[1] / "outputs")
    parser.add_argument("--variants-file", type=Path, default=Path(__file__).resolve().parents[1] / "10_genesis" / "variants.yaml")
    parser.add_argument("--report-path", type=Path, default=Path(__file__).resolve().parents[1] / "reports" / "simulation_report.md")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.report_path.parent.mkdir(parents=True, exist_ok=True)

    manifest = load_manifest(args.outputs_dir)
    variants = load_variants(args.variants_file)
    rows = list(iter_rows(args.outputs_dir, manifest))
    markdown = format_markdown(manifest, rows, variants)
    args.report_path.write_text(markdown, encoding="utf-8")
    print(f"Report written to {args.report_path}")


if __name__ == "__main__":
    main()
