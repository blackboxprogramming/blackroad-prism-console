"""Stubbed simulation pipeline used by :mod:`cli` to generate study artefacts."""

from __future__ import annotations

import csv
import json
import statistics
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Sequence

from .metrics import (
    max_error,
    mean_absolute_error,
    pass_rate,
    root_mean_square_error,
)

BASE_DIR = Path(__file__).resolve().parent.parent


@dataclass
class Scenario:
    """Simple record describing a simulation scenario."""

    name: str
    target_force: float
    solid_response: float
    fluid_response: float

    @property
    def solid_error(self) -> float:
        return self.solid_response - self.target_force

    @property
    def fluid_error(self) -> float:
        return self.fluid_response - self.target_force


@dataclass
class Variant:
    """Variant derived from a base scenario with perturbed inputs."""

    source: str
    material: str
    modifier: float
    expected_force: float


@dataclass
class MetricBlock:
    label: str
    mae: float
    rmse: float
    max_err: float
    pass_fraction: float

    def as_dict(self) -> Dict[str, float]:
        return {
            "label": self.label,
            "mae": round(self.mae, 4),
            "rmse": round(self.rmse, 4),
            "max_error": round(self.max_err, 4),
            "pass_fraction": round(self.pass_fraction, 4),
        }


ERROR_LIMIT = 0.75


def generate_dummy_cases(seed: int = 7) -> List[Scenario]:
    """Return a deterministic set of placeholder scenarios."""

    base_targets = [12.5, 18.2, 9.1, 14.8]
    solid_offsets = [0.6, -0.8, 0.3, -1.0]
    fluid_offsets = [-0.2, 1.1, -0.4, 0.5]
    scenarios = []
    for idx, target in enumerate(base_targets, start=1):
        scenarios.append(
            Scenario(
                name=f"Case {idx}",
                target_force=target,
                solid_response=target + solid_offsets[idx - 1],
                fluid_response=target + fluid_offsets[idx - 1],
            )
        )
    return scenarios


def _calc_metrics(label: str, actual: Sequence[float], predicted: Sequence[float]) -> MetricBlock:
    mae = mean_absolute_error(actual, predicted)
    rmse = root_mean_square_error(actual, predicted)
    max_err = max_error(actual, predicted)
    pass_fraction = pass_rate((a - b for a, b in zip(predicted, actual)), ERROR_LIMIT)
    return MetricBlock(label=label, mae=mae, rmse=rmse, max_err=max_err, pass_fraction=pass_fraction)


def evaluate_material_models(cases: Sequence[Scenario]) -> Dict[str, MetricBlock]:
    """Compute aggregate metrics for the solid and fluid response stubs."""

    targets = [case.target_force for case in cases]
    solid_predictions = [case.solid_response for case in cases]
    fluid_predictions = [case.fluid_response for case in cases]
    solid_metrics = _calc_metrics("solid", targets, solid_predictions)
    fluid_metrics = _calc_metrics("fluid", targets, fluid_predictions)
    return {"solid": solid_metrics, "fluid": fluid_metrics}


def derive_thresholds(blocks: Iterable[MetricBlock]) -> Dict[str, bool]:
    """Return pass/fail flags for each metric block using :data:`ERROR_LIMIT`."""

    results: Dict[str, bool] = {}
    for block in blocks:
        results[block.label] = block.pass_fraction >= 0.75
    return results


def build_variants(cases: Sequence[Scenario]) -> List[Variant]:
    """Produce simple material variants for each base case."""

    variants: List[Variant] = []
    material_profiles = {
        "solid": 1.05,
        "fluid": 0.95,
    }
    for case in cases:
        for material, modifier in material_profiles.items():
            variants.append(
                Variant(
                    source=case.name,
                    material=material,
                    modifier=modifier,
                    expected_force=round(case.target_force * modifier, 3),
                )
            )
    return variants


def assemble_summary(
    cases: Sequence[Scenario],
    metrics: Dict[str, MetricBlock],
    thresholds: Dict[str, bool],
    variants: Sequence[Variant],
) -> Dict[str, object]:
    """Return a dictionary with roll-up information for downstream exports."""

    return {
        "cases": [
            {
                "name": case.name,
                "target": case.target_force,
                "solid": case.solid_response,
                "fluid": case.fluid_response,
                "solid_error": round(case.solid_error, 4),
                "fluid_error": round(case.fluid_error, 4),
            }
            for case in cases
        ],
        "metrics": {label: block.as_dict() for label, block in metrics.items()},
        "thresholds": thresholds,
        "variant_count": len(variants),
    }


def render_report(summary: Dict[str, object]) -> str:
    """Generate a Markdown report summarising the stub pipeline results."""

    metrics = summary["metrics"]
    threshold_text = "\n".join(
        f"- **{label.title()} model**: {'PASS' if passed else 'FAIL'}"
        for label, passed in summary["thresholds"].items()
    )
    mean_target = statistics.mean(case["target"] for case in summary["cases"])
    return (
        "# Universal Simulation Starter\n\n"
        "This run bundles deterministic stub data to mimic a multi-physics stack.\n\n"
        "## Aggregate metrics\n"
        f"- Solid MAE: {metrics['solid']['mae']:.3f}\n"
        f"- Fluid MAE: {metrics['fluid']['mae']:.3f}\n\n"
        "## Threshold evaluation\n"
        f"{threshold_text}\n\n"
        "## Scenario overview\n"
        f"- Number of scenarios: {len(summary['cases'])}\n"
        f"- Mean target force: {mean_target:.3f}\n"
        f"- Material variants synthesised: {summary['variant_count']}\n"
    )


def _write_summary_files(summary: Dict[str, object], output_dir: Path) -> Dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "summary_metrics.json"
    json_path.write_text(json.dumps(summary, indent=2) + "\n")

    csv_path = output_dir / "summary_cases.csv"
    case_fields = ["name", "target", "solid", "fluid", "solid_error", "fluid_error"]
    with csv_path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=case_fields)
        writer.writeheader()
        for case in summary["cases"]:
            writer.writerow(case)

    return {
        "json": str(json_path.relative_to(BASE_DIR)),
        "csv": str(csv_path.relative_to(BASE_DIR)),
    }


def _write_variants_csv(variants: Sequence[Variant], output_dir: Path) -> str:
    csv_path = output_dir / "summary_variants.csv"
    with csv_path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["source", "material", "modifier", "expected_force"])
        for variant in variants:
            writer.writerow([variant.source, variant.material, variant.modifier, variant.expected_force])
    return str(csv_path.relative_to(BASE_DIR))


def build_run_meta(files: Dict[str, str], metrics: Dict[str, MetricBlock]) -> Dict[str, object]:
    return {
        "run_id": str(uuid.uuid4()),
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "artifacts": files,
        "metrics": {label: block.as_dict() for label, block in metrics.items()},
    }


def run_pipeline() -> Dict[str, str]:
    """Entry point invoked by :mod:`cli` to produce artefacts."""

    cases = generate_dummy_cases()
    metric_blocks = evaluate_material_models(cases)
    thresholds = derive_thresholds(metric_blocks.values())
    variants = build_variants(cases)
    summary = assemble_summary(cases, metric_blocks, thresholds, variants)

    compare_dir = BASE_DIR / "40_compare" / "outputs"
    report_dir = BASE_DIR / "90_reports"
    compare_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)

    files: Dict[str, str] = {}
    files.update(_write_summary_files(summary, compare_dir))
    files["variants"] = _write_variants_csv(variants, compare_dir)

    report_text = render_report(summary)
    report_path = report_dir / "run_report.md"
    report_path.write_text(report_text + "\n")
    files["report"] = str(report_path.relative_to(BASE_DIR))

    meta_path = BASE_DIR / "run_meta.json"
    files["run_meta"] = str(meta_path.relative_to(BASE_DIR))
    meta = build_run_meta(files, metric_blocks)
    meta_path.write_text(json.dumps(meta, indent=2) + "\n")

    return files
