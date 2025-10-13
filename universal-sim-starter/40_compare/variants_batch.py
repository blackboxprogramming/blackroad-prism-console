"""Batch metric comparison for the universal simulation starter variants."""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np

# Ensure local metrics module is importable when running as a script.
import sys

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.append(str(CURRENT_DIR))

from metrics import (  # noqa: E402  # pylint: disable=wrong-import-position
    contact_time_diff,
    hausdorff_distance,
    mass_drift,
    splash_MSE,
    stress_L2,
)


@dataclass
class MetricThresholds:
    hausdorff: float = 0.05
    stress_l2: float = 5_000.0
    contact_dt: float = 0.05
    splash_mse: float = 5e-3
    mass_drift_max: float = 5e-2
    mass_drift_final: float = 2e-2


@dataclass
class MetricResult:
    value: Optional[float]
    threshold: Optional[float]
    status: str


@dataclass
class MassDriftResult:
    max_value: Optional[float]
    final_value: Optional[float]
    max_threshold: Optional[float]
    final_threshold: Optional[float]
    status: str


@dataclass
class VariantSummary:
    name: str
    metrics: Dict[str, object]
    overall_status: str
    notes: List[str]


THRESHOLDS = MetricThresholds()
METRIC_ORDER = [
    "hausdorff",
    "stress_l2",
    "contact_dt",
    "splash_mse",
    "mass_drift",
]


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Run metric comparisons for baseline and variant outputs.")
    parser.add_argument(
        "--artifacts",
        type=Path,
        default=project_root / "artifacts",
        help="Root directory containing baseline solver outputs.",
    )
    parser.add_argument(
        "--genesis-dir",
        type=Path,
        default=project_root / "10_genesis",
        help="Directory containing baseline and variant Genesis prompt outputs.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=CURRENT_DIR / "outputs",
        help="Directory to store JSON/CSV/TXT summaries.",
    )
    return parser.parse_args()


def discover_variants(genesis_dir: Path) -> List[str]:
    variants: List[str] = []
    for candidate in sorted(genesis_dir.glob("outputs_*")):
        if candidate.is_dir():
            variants.append(candidate.name.replace("outputs_", "", 1))
    if "baseline" not in variants:
        variants.insert(0, "baseline")
    return variants


def load_array(path: Path) -> Optional[np.ndarray]:
    if not path.exists():
        return None
    return np.load(path, allow_pickle=False)


def collect_solver_outputs(solid_dir: Path, fluid_dir: Path) -> Dict[str, Dict[str, Optional[np.ndarray]]]:
    return {
        "solid": {
            "positions": load_array(solid_dir / "x.npy"),
            "stress": load_array(solid_dir / "stress.npy"),
            "contact": load_array(solid_dir / "contact_time.npy"),
        },
        "fluid": {
            "height": load_array(fluid_dir / "height.npy"),
            "mass": load_array(fluid_dir / "mass.npy"),
        },
    }


def locate_variant_dirs(variant: str, artifacts_root: Path) -> Tuple[Path, Path, List[str]]:
    notes: List[str] = []
    baseline_solid = artifacts_root / "solid"
    baseline_fluid = artifacts_root / "fluid"
    if variant == "baseline":
        return baseline_solid, baseline_fluid, notes

    variant_solid = artifacts_root / "variants" / variant / "solid"
    variant_fluid = artifacts_root / "variants" / variant / "fluid"

    if not variant_solid.exists():
        notes.append("solid outputs fallback to baseline")
        variant_solid = baseline_solid
    if not variant_fluid.exists():
        notes.append("fluid outputs fallback to baseline")
        variant_fluid = baseline_fluid

    return variant_solid, variant_fluid, notes


def evaluate_metric(value: Optional[float], threshold: float) -> MetricResult:
    if value is None:
        return MetricResult(value=None, threshold=threshold, status="missing")
    status = "pass" if value <= threshold else "fail"
    return MetricResult(value=float(value), threshold=threshold, status=status)


def evaluate_mass_drift(
    max_value: Optional[float],
    final_value: Optional[float],
    thresholds: MetricThresholds,
) -> MassDriftResult:
    if max_value is None or final_value is None:
        return MassDriftResult(None, None, thresholds.mass_drift_max, thresholds.mass_drift_final, "missing")

    max_abs = abs(float(max_value))
    final_abs = abs(float(final_value))
    passes = max_abs <= thresholds.mass_drift_max and final_abs <= thresholds.mass_drift_final
    status = "pass" if passes else "fail"
    return MassDriftResult(max_abs, final_abs, thresholds.mass_drift_max, thresholds.mass_drift_final, status)


def compute_metrics(
    variant: str,
    baseline_data: Dict[str, Dict[str, Optional[np.ndarray]]],
    variant_data: Dict[str, Dict[str, Optional[np.ndarray]]],
    thresholds: MetricThresholds,
    notes: Iterable[str],
) -> VariantSummary:
    solid_base = baseline_data["solid"]
    fluid_base = baseline_data["fluid"]
    solid_variant = variant_data["solid"]
    fluid_variant = variant_data["fluid"]

    results: Dict[str, object] = {}
    note_list = list(notes)

    # Hausdorff distance on the final solid frame
    haus_value: Optional[float] = None
    if solid_base["positions"] is not None and solid_variant["positions"] is not None:
        base_points = solid_base["positions"][-1].reshape(-1, 3)
        variant_points = solid_variant["positions"][-1].reshape(-1, 3)
        haus_value = hausdorff_distance(base_points, variant_points)
    results["hausdorff"] = evaluate_metric(haus_value, thresholds.hausdorff)

    # Stress L2 difference
    stress_value: Optional[float] = None
    if solid_base["stress"] is not None and solid_variant["stress"] is not None:
        stress_value = stress_L2(solid_variant["stress"], solid_base["stress"])
    results["stress_l2"] = evaluate_metric(stress_value, thresholds.stress_l2)

    # Contact timing difference
    contact_value: Optional[float] = None
    if solid_base["contact"] is not None and solid_variant["contact"] is not None:
        contact_value = contact_time_diff(float(solid_variant["contact"].ravel()[0]), float(solid_base["contact"].ravel()[0]))
    results["contact_dt"] = evaluate_metric(contact_value, thresholds.contact_dt)

    # Splash height error
    splash_value: Optional[float] = None
    if fluid_base["height"] is not None and fluid_variant["height"] is not None:
        splash_value = splash_MSE(fluid_variant["height"], fluid_base["height"])
    results["splash_mse"] = evaluate_metric(splash_value, thresholds.splash_mse)

    # Mass drift absolute extrema
    mass_result: MassDriftResult
    if fluid_variant["mass"] is not None:
        max_drift, final_drift = mass_drift(fluid_variant["mass"])
        mass_result = evaluate_mass_drift(max_drift, final_drift, thresholds)
    else:
        mass_result = evaluate_mass_drift(None, None, thresholds)
    results["mass_drift"] = mass_result

    statuses = [
        results["hausdorff"].status,  # type: ignore[union-attr]
        results["stress_l2"].status,  # type: ignore[union-attr]
        results["contact_dt"].status,  # type: ignore[union-attr]
        results["splash_mse"].status,  # type: ignore[union-attr]
        mass_result.status,
    ]

    if any(status == "fail" for status in statuses):
        overall = "fail"
    elif all(status == "missing" for status in statuses):
        overall = "missing"
    elif any(status == "missing" for status in statuses):
        overall = "partial"
    else:
        overall = "pass"

    return VariantSummary(name=variant, metrics=results, overall_status=overall, notes=note_list)


def summary_to_dict(summary: VariantSummary) -> Dict[str, object]:
    metrics = summary.metrics
    haus: MetricResult = metrics["hausdorff"]  # type: ignore[assignment]
    stress: MetricResult = metrics["stress_l2"]  # type: ignore[assignment]
    contact: MetricResult = metrics["contact_dt"]  # type: ignore[assignment]
    splash: MetricResult = metrics["splash_mse"]  # type: ignore[assignment]
    mass: MassDriftResult = metrics["mass_drift"]  # type: ignore[assignment]

    return {
        "name": summary.name,
        "overall_status": summary.overall_status,
        "metrics": {
            "hausdorff": {
                "value": haus.value,
                "threshold": haus.threshold,
                "status": haus.status,
            },
            "stress_l2": {
                "value": stress.value,
                "threshold": stress.threshold,
                "status": stress.status,
            },
            "contact_dt": {
                "value": contact.value,
                "threshold": contact.threshold,
                "status": contact.status,
            },
            "splash_mse": {
                "value": splash.value,
                "threshold": splash.threshold,
                "status": splash.status,
            },
            "mass_drift": {
                "max": mass.max_value,
                "final": mass.final_value,
                "max_threshold": mass.max_threshold,
                "final_threshold": mass.final_threshold,
                "status": mass.status,
            },
        },
        "notes": summary.notes,
    }


def write_json(output_path: Path, generated_at: str, summaries: List[VariantSummary]) -> None:
    payload = {
        "generated_at": generated_at,
        "thresholds": {
            "hausdorff": THRESHOLDS.hausdorff,
            "stress_l2": THRESHOLDS.stress_l2,
            "contact_dt": THRESHOLDS.contact_dt,
            "splash_mse": THRESHOLDS.splash_mse,
            "mass_drift_max": THRESHOLDS.mass_drift_max,
            "mass_drift_final": THRESHOLDS.mass_drift_final,
        },
        "variants": [summary_to_dict(item) for item in summaries],
    }
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def write_csv(output_path: Path, summaries: List[VariantSummary]) -> None:
    fieldnames = [
        "variant",
        "overall_status",
        "hausdorff",
        "hausdorff_threshold",
        "hausdorff_status",
        "stress_l2",
        "stress_l2_threshold",
        "stress_l2_status",
        "contact_dt",
        "contact_dt_threshold",
        "contact_dt_status",
        "splash_mse",
        "splash_mse_threshold",
        "splash_mse_status",
        "mass_drift_max",
        "mass_drift_max_threshold",
        "mass_drift_final",
        "mass_drift_final_threshold",
        "mass_drift_status",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for summary in summaries:
            metrics = summary.metrics
            haus: MetricResult = metrics["hausdorff"]  # type: ignore[assignment]
            stress: MetricResult = metrics["stress_l2"]  # type: ignore[assignment]
            contact: MetricResult = metrics["contact_dt"]  # type: ignore[assignment]
            splash: MetricResult = metrics["splash_mse"]  # type: ignore[assignment]
            mass: MassDriftResult = metrics["mass_drift"]  # type: ignore[assignment]
            writer.writerow(
                {
                    "variant": summary.name,
                    "overall_status": summary.overall_status,
                    "hausdorff": haus.value,
                    "hausdorff_threshold": haus.threshold,
                    "hausdorff_status": haus.status,
                    "stress_l2": stress.value,
                    "stress_l2_threshold": stress.threshold,
                    "stress_l2_status": stress.status,
                    "contact_dt": contact.value,
                    "contact_dt_threshold": contact.threshold,
                    "contact_dt_status": contact.status,
                    "splash_mse": splash.value,
                    "splash_mse_threshold": splash.threshold,
                    "splash_mse_status": splash.status,
                    "mass_drift_max": mass.max_value,
                    "mass_drift_max_threshold": mass.max_threshold,
                    "mass_drift_final": mass.final_value,
                    "mass_drift_final_threshold": mass.final_threshold,
                    "mass_drift_status": mass.status,
                }
            )


def write_text(output_path: Path, generated_at: str, summaries: List[VariantSummary]) -> None:
    lines = [f"Variant comparison summary generated {generated_at}", ""]
    for summary in summaries:
        badge = {
            "pass": "✅ PASS",
            "fail": "❌ FAIL",
            "partial": "⚠️ PARTIAL",
            "missing": "⚠️ MISSING",
        }.get(summary.overall_status, summary.overall_status.upper())
        lines.append(f"{summary.name}: {badge}")
        metrics = summary.metrics
        haus: MetricResult = metrics["hausdorff"]  # type: ignore[assignment]
        stress: MetricResult = metrics["stress_l2"]  # type: ignore[assignment]
        contact: MetricResult = metrics["contact_dt"]  # type: ignore[assignment]
        splash: MetricResult = metrics["splash_mse"]  # type: ignore[assignment]
        mass: MassDriftResult = metrics["mass_drift"]  # type: ignore[assignment]
        lines.extend(
            [
                f"  - Hausdorff: {haus.value} (≤ {haus.threshold}) [{haus.status}]",
                f"  - Stress L2: {stress.value} (≤ {stress.threshold}) [{stress.status}]",
                f"  - Contact Δt: {contact.value} (≤ {contact.threshold}) [{contact.status}]",
                f"  - Splash MSE: {splash.value} (≤ {splash.threshold}) [{splash.status}]",
                f"  - Mass drift max/final: {mass.max_value}/{mass.final_value} (≤ {mass.max_threshold}/{mass.final_threshold}) [{mass.status}]",
            ]
        )
        for note in summary.notes:
            lines.append(f"    note: {note}")
        lines.append("")
    output_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    variants = discover_variants(args.genesis_dir)
    solid_baseline = args.artifacts / "solid"
    fluid_baseline = args.artifacts / "fluid"
    baseline_data = collect_solver_outputs(solid_baseline, fluid_baseline)

    summaries: List[VariantSummary] = []
    for variant in variants:
        solid_dir, fluid_dir, notes = locate_variant_dirs(variant, args.artifacts)
        variant_data = collect_solver_outputs(solid_dir, fluid_dir)
        summaries.append(compute_metrics(variant, baseline_data, variant_data, THRESHOLDS, notes))

    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    generated_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    json_path = args.output_dir / f"summary_variants_{timestamp}.json"
    csv_path = args.output_dir / f"summary_variants_{timestamp}.csv"
    txt_path = args.output_dir / f"summary_variants_{timestamp}.txt"

    write_json(json_path, generated_at, summaries)
    write_csv(csv_path, summaries)
    write_text(txt_path, generated_at, summaries)

    print(f"Wrote variant summaries to {json_path}, {csv_path}, and {txt_path}")


if __name__ == "__main__":
    main()
