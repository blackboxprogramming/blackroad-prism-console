"""Static assets for the job applier service."""
from __future__ import annotations

from dataclasses import dataclass
from importlib import resources
import json
from typing import Dict


@dataclass(frozen=True)
class Asset:
    """Metadata describing a packaged asset."""

    key: str
    description: str
    filename: str
    media_type: str

    def load(self):
        """Return the asset payload.

        Text-based assets are returned as strings while JSON assets are parsed
        into Python data structures for FastAPI to serialise automatically.
        """

        data = resources.files(__name__).joinpath(self.filename)
        text = data.read_text(encoding="utf-8")
        if self.media_type == "application/json":
            return json.loads(text)
        return text


_ASSETS: Dict[str, Asset] = {
    "ats_resume_template": Asset(
        key="ats_resume_template",
        description="ATS-ready resume template with summary and impact bullet placeholders.",
        filename="ats_resume_template.txt",
        media_type="text/plain",
    ),
    "cover_note_micro_template": Asset(
        key="cover_note_micro_template",
        description="150-180 word cover note scaffold for quick paste into applications.",
        filename="cover_note_micro_template.txt",
        media_type="text/plain",
    ),
    "application_qa_schema": Asset(
        key="application_qa_schema",
        description="Structured JSON of common application questions and placeholders.",
        filename="application_qa_schema.json",
        media_type="application/json",
    ),
    "field_map_cheat_sheet": Asset(
        key="field_map_cheat_sheet",
        description="Cheat sheet mapping core values to Greenhouse/Lever/Workday fields.",
        filename="field_map_cheat_sheet.md",
        media_type="text/markdown",
    ),
}


def list_assets() -> Dict[str, Dict[str, str]]:
    """Return a mapping of asset keys to metadata."""

    return {
        key: {"description": asset.description, "media_type": asset.media_type}
        for key, asset in sorted(_ASSETS.items())
    }


def get_asset(key: str) -> Asset:
    """Fetch the asset metadata for ``key``.

    Raises
    ------
    KeyError
        If the asset has not been registered.
    """

    try:
        return _ASSETS[key]
    except KeyError as exc:  # pragma: no cover - narrow helper
        raise KeyError(key) from exc


__all__ = ["Asset", "get_asset", "list_assets"]
