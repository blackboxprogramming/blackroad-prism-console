"""Tone and formatting helpers per audience."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


@dataclass(frozen=True)
class ToneProfile:
    """Simple structure describing how to address an audience."""

    headline: str
    cadence: str
    emphasis: str


TONE_PACKS: Dict[str, ToneProfile] = {
    "engineers": ToneProfile(
        headline="Systems & Signals",
        cadence="Terse, data-forward paragraphs with explicit failure analysis.",
        emphasis="Diagrams, benchmarks, and reproducibility.",
    ),
    "creators": ToneProfile(
        headline="Worldbuilding Notes",
        cadence="Metaphor-rich pacing with visual anchors first.",
        emphasis="Prompts to remix and ways to play.",
    ),
    "investors": ToneProfile(
        headline="Arc & Moat",
        cadence="Risk/return framing with timelines and capital moments.",
        emphasis="Moat maps, runway checkpoints, and momentum.",
    ),
    "kids": ToneProfile(
        headline="Quest Log",
        cadence="Friendly narrator voice with character dialogue.",
        emphasis="Kindness counters and achievable quests.",
    ),
}


def get_tone(audience: str) -> ToneProfile:
    """Return the tone profile for an audience, defaulting to engineers."""

    return TONE_PACKS.get(audience, TONE_PACKS["engineers"])
