"""Generate a textual dashboard for the Jetson bridge."""

from __future__ import annotations

from typing import Mapping, Sequence

from .config import resolve_target
from . import jobs, telemetry


def build(host: str | None = None, user: str | None = None) -> Mapping[str, object]:
    """Return a consolidated snapshot for the dashboard service."""

    resolved_host, resolved_user = resolve_target(host, user)
    telemetry_snapshot = telemetry.collect(resolved_host, resolved_user)
    job_snapshot = jobs.list_jobs(resolved_host, resolved_user)

    return {
        "host": resolved_host,
        "user": resolved_user,
        "telemetry": telemetry_snapshot,
        "jobs": job_snapshot,
    }


def _fmt_metric(key: str, value: object) -> str:
    return f"{key}: {value}"


def _format_metrics(metrics: Mapping[str, object]) -> Sequence[str]:
    lines: list[str] = []
    for key, value in metrics.items():
        lines.append(_fmt_metric(key, value))
    return lines


def render_text(snapshot: Mapping[str, object]) -> str:
    """Render the dashboard snapshot as human friendly text."""

    lines = [f"Jetson target: {snapshot['user']}@{snapshot['host']}"]

    telem = snapshot.get("telemetry", {}) or {}
    if telem:
        lines.append("Telemetry:")
        metrics = telem.get("metrics") or {}
        if isinstance(metrics, Mapping) and metrics:
            for line in _format_metrics(metrics):
                lines.append(f"  {line}")
        else:
            lines.append(f"  raw: {telem.get('raw', 'no data')}")
        if error := telem.get("error"):
            lines.append(f"  error: {error}")

    job_info = snapshot.get("jobs", {}) or {}
    if job_info:
        lines.append("Jobs:")
        jobs_payload = job_info.get("jobs")
        if isinstance(jobs_payload, Sequence) and jobs_payload:
            for job in jobs_payload:
                if isinstance(job, Mapping):
                    unit = job.get("unit", "unknown")
                    state = job.get("state", "?")
                    job_id = job.get("id", "-")
                    lines.append(f"  #{job_id} {unit} ({state})")
        if error := job_info.get("error"):
            lines.append(f"  error: {error}")

    return "\n".join(lines)


__all__ = ["build", "render_text"]
