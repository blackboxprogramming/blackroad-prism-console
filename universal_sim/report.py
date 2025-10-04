"""Markdown reporting helpers."""
from __future__ import annotations

from pathlib import Path
from typing import Dict

from .paths import SimulationPaths, PATHS


def render_markdown(metrics: Dict) -> str:
    lines = ["# Universal Simulation Metrics", ""]
    if not metrics:
        lines.append("No metrics available. Run `make orchestrate` followed by `make check`.")
        return "\n".join(lines)
    for category, fields in metrics.items():
        lines.append(f"## {category.title()}")
        lines.append("")
        lines.append("| field | mae | rmse | max_abs | mean_delta | baseline_mean | bench_mean | shape |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
        for name, stats in fields.items():
            shape = "×".join(str(dim) for dim in stats.get("shape", []))
            lines.append(
                "| {name} | {mae:.4f} | {rmse:.4f} | {max_abs:.4f} | {mean_delta:.4f} | {base:.4f} | {bench:.4f} | {shape} |".format(
                    name=name,
                    mae=stats.get("mae", 0.0),
                    rmse=stats.get("rmse", 0.0),
                    max_abs=stats.get("max_abs", 0.0),
                    mean_delta=stats.get("mean_delta", 0.0),
                    base=stats.get("baseline_mean", 0.0),
                    bench=stats.get("bench_mean", 0.0),
                    shape=shape or "-",
                )
            )
        lines.append("")
    return "\n".join(lines)


def write_report(metrics: Dict, destination: Path, paths: SimulationPaths = PATHS) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(render_markdown(metrics), encoding="utf-8")
    return destination
