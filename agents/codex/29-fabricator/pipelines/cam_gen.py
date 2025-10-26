"""Generate lightweight toolpaths for flat panel fabrication."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List


@dataclass(frozen=True)
class Toolpath:
    """Representation of a generated toolpath."""

    name: str
    gcode: str


def _format_outline(points: Iterable[List[float]]) -> str:
    moves = ["G21 ; metric"]
    for idx, (x, y) in enumerate(points):
        prefix = "G0" if idx == 0 else "G1"
        moves.append(f"{prefix} X{x:.3f} Y{y:.3f}")
    moves.append("G1 X0 Y0")
    moves.append("M2")
    return "\n".join(moves)


def generate(design: Dict[str, object]) -> List[Toolpath]:
    """Create naive G-code for each panel in the design."""

    panels = design.get("panels", [])
    toolpaths: List[Toolpath] = []
    for panel in panels:
        outline = panel.get("outline")
        if not outline:
            continue
        name = panel.get("name", "panel")
        toolpaths.append(Toolpath(name=name, gcode=_format_outline(outline)))
    return toolpaths


def write_to_directory(toolpaths: Iterable[Toolpath], directory: Path) -> List[Path]:
    """Persist toolpaths to ``.gcode`` files."""

    directory.mkdir(parents=True, exist_ok=True)
    generated: List[Path] = []
    for path in toolpaths:
        target = directory / f"{path.name}.gcode"
        target.write_text(path.gcode, encoding="utf-8")
        generated.append(target)
    return generated


__all__ = ["Toolpath", "generate", "write_to_directory"]
