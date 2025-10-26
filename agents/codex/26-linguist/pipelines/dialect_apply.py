"""Dialects application pipeline for Codex-26."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Dict, List

import yaml

_PACKS_DIR = Path(__file__).resolve().parent.parent / "packs"
_DEFAULT_PACK = "core"
_CONTRACTION_MAP = {
    "can't": "cannot",
    "won't": "will not",
    "it's": "it is",
    "I'm": "I am",
    "we're": "we are",
    "they're": "they are",
}


def _apply_contractions(text: str, allow_contractions: bool) -> str:
    """Expand common contractions when the dialect discourages them."""
    if allow_contractions:
        return text
    updated = text
    for contraction, expanded in _CONTRACTION_MAP.items():
        updated = updated.replace(contraction, expanded)
        updated = updated.replace(contraction.capitalize(), expanded.capitalize())
    return updated


@lru_cache(maxsize=16)
def _load_pack(name: str) -> Dict[str, object]:
    candidate = _PACKS_DIR / f"{name}.yaml"
    if not candidate.exists():
        candidate = _PACKS_DIR / f"{_DEFAULT_PACK}.yaml"
    with candidate.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def apply_dialect(normalized: Dict[str, object], audience: str) -> Dict[str, object]:
    """Apply the requested dialect pack to normalized text."""
    pack = _load_pack(audience)
    styled_text = _apply_contractions(str(normalized.get("text", "")), pack["style"].get("contractions", True))
    emoji_map = dict(normalized.get("emoji_map", {}))
    notes: List[str] = list(normalized.get("notes", []))
    notes.append(f"Tone set to {pack['tone']}")

    return {
        "text": styled_text,
        "dialect": pack["id"],
        "dialect_config": pack,
        "emoji_map": emoji_map,
        "notes": notes,
    }


__all__ = ["apply_dialect"]
