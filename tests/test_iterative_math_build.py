"""Tests for :mod:`lucidia_math_lab.iterative_math_build`."""

from __future__ import annotations

import sys
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from statistics import fmean

import pytest

MODULE_PATH = Path(__file__).resolve().parents[1] / "lucidia_math_lab" / "iterative_math_build.py"
SPEC = spec_from_file_location("iterative_math_build", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
_module = module_from_spec(SPEC)
sys.modules[SPEC.name] = _module
SPEC.loader.exec_module(_module)

capture_snapshot = _module.capture_snapshot


def test_capture_snapshot_requires_two_pulses() -> None:
    """A snapshot needs at least two pulses to compute phase drift."""

    with pytest.raises(ValueError, match="at least 2"):
        capture_snapshot(pulses=1)


def test_capture_snapshot_computes_summary_metrics() -> None:
    """Snapshot contains derived metrics consistent with the captured pulses."""

    pulses = 5
    snapshot = capture_snapshot(pulses=pulses, gain=3.8, seed_level=0.3, tag_prefix="test_run")

    assert len(snapshot.pulse_levels) == pulses
    assert snapshot.phase_drift == pytest.approx(
        snapshot.pulse_levels[-1] - snapshot.pulse_levels[-2]
    )
    assert snapshot.mean_level == pytest.approx(fmean(snapshot.pulse_levels))
    assert snapshot.tag.startswith("test_run_")
