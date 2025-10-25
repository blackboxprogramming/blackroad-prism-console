"""Reflex hook to begin a repair arc when Guardian spots a contradiction."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.beat_detect import contradiction_to_beats


@BUS.on("guardian:contradiction")
def repair_arc(event: dict) -> None:
    """Emit a draft arc for Guardian contradiction events."""

    beats = contradiction_to_beats(event)
    BUS.emit("codex:episode.draft", {"beats": beats, "mood": "repair"})


if __name__ == "__main__":  # pragma: no cover
    start()
