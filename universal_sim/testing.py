"""Helper entry points for test automation."""

from __future__ import annotations

import sys
from pathlib import Path


def run_metric_tests() -> int:
    """Execute the pytest suite for the metric helpers if available."""

    try:
        import pytest
    except ModuleNotFoundError:
        print("pytest is not installed; skipping metric tests.")
        return 0

    test_path = Path(__file__).resolve().parent.parent / "tests" / "test_metrics.py"
    return pytest.main(["-q", str(test_path)])


if __name__ == "__main__":  # pragma: no cover - manual entry point
    sys.exit(run_metric_tests())
