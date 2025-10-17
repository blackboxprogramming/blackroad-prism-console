"""Validate payloads before publishing to MQTT."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class HoloTextPayload(BaseModel):
    """Schema for holographic text commands."""

    text: str = Field(..., min_length=1, max_length=512)
    duration_ms: int = Field(4000, ge=250, le=600_000)
    size: int = Field(64, ge=8, le=256)
    effect: Optional[str] = Field(default=None, max_length=64)


class PanelLine(BaseModel):
    """Single line of text for the simulator panel."""

    text: str = Field(..., min_length=1, max_length=96)
    icon: Optional[str] = Field(default=None, max_length=32)


class SimPanelPayload(BaseModel):
    """Payload describing a simulator panel update."""

    panel_id: str = Field(..., min_length=1, max_length=32)
    lines: List[PanelLine]
    duration_ms: int = Field(5000, ge=500, le=600_000)
    accent: Optional[str] = Field(default=None, regex=r"^#[0-9A-Fa-f]{6}$")
    brightness: Optional[int] = Field(default=None, ge=0, le=100)

    @validator("lines", pre=True)
    def _coerce_lines(cls, value: Any) -> List[PanelLine]:  # noqa: N805
        if isinstance(value, dict):
            raise TypeError("lines must be a list of objects")
        return value


def build_holo_text_payload(**kwargs: Any) -> Dict[str, Any]:
    """Return a validated hologram payload."""
    payload = HoloTextPayload(**kwargs)
    data = payload.dict(exclude_none=True)
    return data


def build_sim_panel_payload(**kwargs: Any) -> Dict[str, Any]:
    """Return a validated simulator panel payload."""
    payload = SimPanelPayload(**kwargs)
    data = payload.dict(exclude_none=True)
    # Convert lines back to list of dicts for JSON serialization
    data["lines"] = [line.dict(exclude_none=True) for line in payload.lines]
    return data
