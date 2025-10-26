"""Normalize incoming bus events for Codex-26."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..pipelines.dialect_apply import apply_dialect
from ..pipelines.energy_cost import estimate
from ..pipelines.normalize import normalize


@BUS.on("msg:incoming")
def handle(event: dict) -> None:
    """Process an incoming message event and rebroadcast the normalized payload."""
    raw = event.get("text", "")
    audience = event.get("audience", "core")
    normalized = normalize(raw)
    dialect_applied = apply_dialect(normalized, audience)
    BUS.emit(
        "msg:normalized",
        {
            "text": dialect_applied["text"],
            "dialect": dialect_applied["dialect"],
            "emoji_map": dialect_applied["emoji_map"],
            "energy_j": estimate(dialect_applied["text"]),
        },
    )


if __name__ == "__main__":  # pragma: no cover
    start()
