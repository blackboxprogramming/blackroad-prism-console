"""Tests for BOM generation."""

from importlib import util
from pathlib import Path
import sys

MODULE_DIR = Path(__file__).resolve().parents[1]

_spec = util.spec_from_file_location(
    "fabricator.bom_from_design", MODULE_DIR / "pipelines" / "bom_from_design.py"
)
assert _spec and _spec.loader
_bom = util.module_from_spec(_spec)
sys.modules[_spec.name] = _bom  # type: ignore[index]
_spec.loader.exec_module(_bom)  # type: ignore[arg-type]


def test_bom_includes_substitutes():
    bom_payload = _bom.generate(  # type: ignore[attr-defined]
        {
            "components": [
                {"designator": "R1", "part": "R100", "quantity": 2},
                {"designator": "U1", "part": "U-PMIC", "quantity": 1},
            ]
        }
    )
    substitutes = {
        line["designator"]: tuple(line["substitutes"]) for line in bom_payload["lines"]
    }
    assert substitutes["R1"], "Resistor should provide approved substitutes"
    assert "LMR33630ADDA" in substitutes["U1"]
