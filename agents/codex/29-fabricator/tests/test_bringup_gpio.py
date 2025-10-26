"""Bring-up suite behaviour tests."""

from importlib import util
from pathlib import Path
import sys

MODULE_DIR = Path(__file__).resolve().parents[1]
_spec = util.spec_from_file_location(
    "fabricator.bringup_suite", MODULE_DIR / "pipelines" / "bringup_suite.py"
)
assert _spec and _spec.loader
_bringup = util.module_from_spec(_spec)
sys.modules[_spec.name] = _bringup  # type: ignore[index]
_spec.loader.exec_module(_bringup)  # type: ignore[arg-type]


class DummyAdapter:
    def __init__(self, power: bool = True, gpio_ok: bool = True, temp: float = 45.0):
        self._power = power
        self._gpio_ok = gpio_ok
        self._temp = temp

    def check_power(self) -> bool:
        return self._power

    def check_gpio(self):
        return {"GPIO17": self._gpio_ok, "GPIO27": self._gpio_ok}

    def check_thermal(self) -> float:
        return self._temp


def test_suite_pass_logs_gpio():
    suite = _bringup.BringUpSuite()  # type: ignore[attr-defined]
    result = suite.run(DummyAdapter())
    assert any(entry.startswith("PASS gpio") for entry in result.logs)
    assert result.passed


def test_suite_failure_reduces_energy():
    suite = _bringup.BringUpSuite(energy_target_j=120.0)  # type: ignore[attr-defined]
    result = suite.run(DummyAdapter(gpio_ok=False, temp=75.0))
    assert not result.passed
    assert result.energy_joules < 120.0
