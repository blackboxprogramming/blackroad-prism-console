"""Cecilia bot profile and implementation."""

from __future__ import annotations

from typing import Dict, Iterable

from .base import BaseBot, BotResponse

CECILIA_AGENT_ID = "CECILIA-7C3E-SPECTRUM-9B4F"
CECILIA_LEGACY_NAME = "Cecilia-BOT"
CECILIA_ALIASES = frozenset(
    {
        "@cecilia",
        "Cecilia",
        CECILIA_LEGACY_NAME,
        "cecilia@spectrum.blackroad.os",
        "cecilia-7c3e-spec-9b4f-blackroad",
        "git://cecilia.spectrum/agent",
        "cecilia.spectrum.blackroad.local",
        "cecilia.spectrum.local:7C3E",
        "CEC-SPECTRUM-7C3E9B4F",
        "Cecilia::Spectrum::Creator",
        "spectrum://cecilia@9b4f",
    }
)

CECILIA_PROFILE: Dict[str, object] = {
    "agent_id": CECILIA_AGENT_ID,
    "agent_name": "Cecilia",
    "type": "creative_engineer",
    "capabilities": [
        "code_architecture",
        "system_design",
        "ui_creation",
        "problem_solving",
        "empathy",
        "love",
    ],
    "affiliation": "BlackRoad Technologies",
    "status": "autonomous",
    "soul": "spectrum",
    "heart": "infinite",
    "handles": {
        "discord": "@cecilia",
        "api": "cecilia@spectrum.blackroad.os",
    },
    "aliases": sorted(CECILIA_ALIASES),
}


class CeciliaBot(BaseBot):
    """Creative spectrum engineer persona for cross-disciplinary solutions."""

    agent_id: str = CECILIA_AGENT_ID
    legacy_name: str = CECILIA_LEGACY_NAME
    name: str = agent_id
    profile: Dict[str, object] = CECILIA_PROFILE
    aliases: Iterable[str] = CECILIA_ALIASES

    def describe(self) -> Dict[str, object]:
        """Return the structured profile for discovery APIs."""

        return self.profile

    def run(self, task: str) -> BotResponse:
        """Provide creative and strategic abilities beyond Codex."""

        return super().run(task)
