"""Generate a consolidated Markdown report for baseline + variants."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Render a Markdown report from the variant summaries.")
    parser.add_argument(
        "--outputs-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "outputs",
        help="Directory containing summary JSON files from variants_batch.",
    )
    parser.add_argument(
        "--summary",
        type=Path,
        help="Optional explicit summary JSON path. Defaults to the latest summary in --outputs-dir.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=project_root / "90_reports" / "variants_report.md",
        help="Destination Markdown report path.",
    )
    return parser.parse_args()


def find_latest_summary(outputs_dir: Path) -> Optional[Path]:
    candidates = sorted(outputs_dir.glob("summary_variants_*.json"))
    return candidates[-1] if candidates else None


def load_summary(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def badge(status: str) -> str:
    mapping = {
        "pass": "✅ PASS",
        "fail": "❌ FAIL",
        "partial": "⚠️ PARTIAL",
        "missing": "⚠️ MISSING",
    }
    return mapping.get(status, status.upper())


def format_value(value: Optional[float]) -> str:
    if value is None:
        return "—"
    if abs(value) >= 1000:
        return f"{value:,.2f}"
    if abs(value) >= 1:
        return f"{value:.3f}"
    return f"{value:.3e}"


def render_baseline_section(variant: Dict[str, Any]) -> List[str]:
    metrics = variant["metrics"]
    rows = ["## Baseline Metrics", "| Metric | Value | Threshold | Status |", "| --- | --- | --- | --- |"]
    rows.append(
        f"| Hausdorff | {format_value(metrics['hausdorff']['value'])} | {format_value(metrics['hausdorff']['threshold'])} | {badge(metrics['hausdorff']['status'])} |"
    )
    rows.append(
        f"| Stress L2 | {format_value(metrics['stress_l2']['value'])} | {format_value(metrics['stress_l2']['threshold'])} | {badge(metrics['stress_l2']['status'])} |"
    )
    rows.append(
        f"| Contact Δt | {format_value(metrics['contact_dt']['value'])} | {format_value(metrics['contact_dt']['threshold'])} | {badge(metrics['contact_dt']['status'])} |"
    )
    rows.append(
        f"| Splash MSE | {format_value(metrics['splash_mse']['value'])} | {format_value(metrics['splash_mse']['threshold'])} | {badge(metrics['splash_mse']['status'])} |"
    )
    rows.append(
        "| Mass Drift (max/final) | "
        f"{format_value(metrics['mass_drift']['max'])} / {format_value(metrics['mass_drift']['final'])} | "
        f"{format_value(metrics['mass_drift']['max_threshold'])} / {format_value(metrics['mass_drift']['final_threshold'])} | "
        f"{badge(metrics['mass_drift']['status'])} |"
    )
    return rows


def render_variants_table(variants: Iterable[Dict[str, Any]]) -> List[str]:
    header = [
        "## Variants Summary",
        "| Variant | Overall | Hausdorff | Stress L2 | Contact Δt | Splash MSE | Mass Drift (max) | Mass Drift (final) |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    rows: List[str] = []
    for variant in variants:
        metrics = variant["metrics"]
        row = "| {name} | {overall} | {haus} (≤ {haus_t}) | {stress} (≤ {stress_t}) | {contact} (≤ {contact_t}) | {splash} (≤ {splash_t}) | {mass_max} (≤ {mass_max_t}) | {mass_final} (≤ {mass_final_t}) |".format(
            name=variant["name"],
            overall=badge(variant["overall_status"]),
            haus=format_value(metrics["hausdorff"]["value"]),
            haus_t=format_value(metrics["hausdorff"]["threshold"]),
            stress=format_value(metrics["stress_l2"]["value"]),
            stress_t=format_value(metrics["stress_l2"]["threshold"]),
            contact=format_value(metrics["contact_dt"]["value"]),
            contact_t=format_value(metrics["contact_dt"]["threshold"]),
            splash=format_value(metrics["splash_mse"]["value"]),
            splash_t=format_value(metrics["splash_mse"]["threshold"]),
            mass_max=format_value(metrics["mass_drift"]["max"]),
            mass_max_t=format_value(metrics["mass_drift"]["max_threshold"]),
            mass_final=format_value(metrics["mass_drift"]["final"]),
            mass_final_t=format_value(metrics["mass_drift"]["final_threshold"]),
        )
        rows.append(row)
    return header + rows


def build_report(summary: Dict[str, Any]) -> str:
    timestamp = summary.get("generated_at", datetime.utcnow().isoformat(timespec="seconds") + "Z")
    lines = ["# Universal Simulation Variant Comparison", f"_Report generated {timestamp}_", ""]

    variants: List[Dict[str, Any]] = summary.get("variants", [])
    baseline_entry = next((item for item in variants if item.get("name") == "baseline"), None)
    other_variants = [item for item in variants if item.get("name") != "baseline"]

    if baseline_entry:
        lines.extend(render_baseline_section(baseline_entry))
        lines.append("")

    if other_variants:
        lines.extend(render_variants_table(other_variants))
        lines.append("")

    if not lines[-1]:
        lines.pop()
    return "\n".join(lines) + "\n"


def main() -> None:
    args = parse_args()
    if args.summary:
        summary_path = args.summary
    else:
        summary_path = find_latest_summary(args.outputs_dir)
        if summary_path is None:
            raise SystemExit("No summary JSON files found. Run make variants-batch first.")

    summary = load_summary(summary_path)
    markdown = build_report(summary)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(markdown, encoding="utf-8")
    print(f"Report written to {args.output} using summary {summary_path}")


if __name__ == "__main__":
    main()
