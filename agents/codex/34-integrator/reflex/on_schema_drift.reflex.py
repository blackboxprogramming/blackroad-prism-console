"""Reflex hook: detect schema drift and emit mapper PR requests."""
from __future__ import annotations

from typing import Dict

from .bus import BUS
from ..pipelines.drift_detect import detect


@BUS.on("connector:schema.sample")
def handle_schema_sample(event: Dict[str, object]) -> None:
    report = detect(dict(event))
    if report.get("drift"):
        BUS.emit("codex:mapper.pr", {"report": report, "mapper": report["mapper"]})
