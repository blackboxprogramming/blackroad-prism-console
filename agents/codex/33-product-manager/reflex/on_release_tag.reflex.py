"""Reflex hook: release tag → release note generation."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.release_notes import make_note


@BUS.on("release:tagged")
def note(event: dict) -> None:
    """Emit a structured release note payload."""
    release_note = make_note(event)
    BUS.emit("codex:release.note", release_note)


if __name__ == "__main__":  # pragma: no cover
    start()
