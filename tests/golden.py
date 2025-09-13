"""Helpers for golden file testing."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest


GOLDEN_DIR = Path(__file__).parent / "golden"


def _normalise(actual: Any) -> str:
    if isinstance(actual, dict):
        return json.dumps(actual, sort_keys=True, indent=2)
    return str(actual)


def assert_matches_golden(path: str, actual: Any) -> None:
    golden_path = GOLDEN_DIR / path
    golden_path.parent.mkdir(parents=True, exist_ok=True)
    actual_str = _normalise(actual) + "\n"
    if not golden_path.exists():
        golden_path.write_text(actual_str, encoding="utf-8")
        pytest.skip(f"golden created at {golden_path}")
    expected = golden_path.read_text(encoding="utf-8")
    assert actual_str == expected
