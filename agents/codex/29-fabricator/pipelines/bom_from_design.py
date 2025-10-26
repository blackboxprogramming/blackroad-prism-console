"""Utility functions for generating a bill of materials from design metadata."""
from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, Iterable, List, Sequence
import json


PARTS_DB_PATH = Path(__file__).resolve().parent.parent / "libs" / "parts.db.json"


@dataclass(frozen=True)
class BomLine:
    """Single line of a BOM."""

    designator: str
    part_number: str
    quantity: int
    description: str
    vendor: str
    substitutes: Sequence[str]

    def as_dict(self) -> Dict[str, object]:
        """Return a serialisable dictionary representation."""

        payload = asdict(self)
        payload["substitutes"] = list(self.substitutes)
        return payload


def _load_parts_db() -> Dict[str, Dict[str, object]]:
    with PARTS_DB_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _normalise_components(components: Iterable[Dict[str, object]]) -> List[Dict[str, object]]:
    normalised = []
    for entry in components:
        if "part" not in entry or "designator" not in entry:
            raise ValueError("Component entries must include 'part' and 'designator'.")
        qty = int(entry.get("quantity", 1))
        if qty <= 0:
            raise ValueError("Quantity must be positive.")
        normalised.append({
            "part": str(entry["part"]),
            "designator": str(entry["designator"]),
            "quantity": qty,
        })
    return normalised


def generate(design: Dict[str, object]) -> Dict[str, object]:
    """Generate a BOM payload from a design description.

    Args:
        design: Mapping containing at least a ``components`` sequence.

    Returns:
        Dictionary containing ``lines`` and a ``summary`` with counts.
    """

    components = design.get("components")
    if components is None:
        raise ValueError("Design must include a 'components' collection.")

    library = _load_parts_db()
    lines: List[BomLine] = []
    for component in _normalise_components(components):
        part_number = component["part"]
        record = library.get(part_number)
        if record is None:
            raise KeyError(f"Unknown part '{part_number}' in library.")
        lines.append(
            BomLine(
                designator=component["designator"],
                part_number=part_number,
                quantity=component["quantity"],
                description=str(record.get("description", "")),
                vendor=str(record.get("vendor", "")),
                substitutes=tuple(record.get("substitutes", [])),
            )
        )

    return {
        "lines": [line.as_dict() for line in lines],
        "summary": {
            "unique_parts": len({line.part_number for line in lines}),
            "total_components": sum(line.quantity for line in lines),
        },
    }


__all__ = ["generate", "BomLine"]
