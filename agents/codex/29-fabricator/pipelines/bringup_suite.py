"""Bring-up tests for Raspberry Pi or Jetson class devices."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, Iterable, List, Protocol


class IOAdapter(Protocol):
    """Adapter that exposes the hardware interactions needed for bring-up."""

    def check_power(self) -> bool:
        ...

    def check_gpio(self) -> Dict[str, bool]:
        ...

    def check_thermal(self) -> float:
        ...


@dataclass
class BringUpResult:
    """Aggregate result of the suite."""

    passed: bool
    energy_joules: float
    logs: List[str] = field(default_factory=list)


@dataclass
class BringUpSuite:
    """Co-ordinate hardware checks in a deterministic order."""

    energy_target_j: float = 120.0
    _checks: List[Callable[[IOAdapter], str]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self._checks:
            self._checks = [
                self._power_check,
                self._gpio_check,
                self._thermal_check,
            ]

    def run(self, adapter: IOAdapter) -> BringUpResult:
        logs: List[str] = []
        failures = 0
        for check in self._checks:
            logs.append(check(adapter))
            if logs[-1].startswith("FAIL"):
                failures += 1
        energy = max(self.energy_target_j - failures * 5.0, 0.0)
        return BringUpResult(passed=failures == 0, energy_joules=energy, logs=logs)

    def _power_check(self, adapter: IOAdapter) -> str:
        return "PASS power" if adapter.check_power() else "FAIL power"

    def _gpio_check(self, adapter: IOAdapter) -> str:
        states = adapter.check_gpio()
        bad_lines = [name for name, ok in states.items() if not ok]
        return (
            "PASS gpio"
            if not bad_lines
            else "FAIL gpio:" + ",".join(sorted(bad_lines))
        )

    def _thermal_check(self, adapter: IOAdapter) -> str:
        temp = adapter.check_thermal()
        return "PASS thermal" if temp < 70.0 else f"FAIL thermal:{temp:.1f}"


__all__ = ["BringUpSuite", "BringUpResult", "IOAdapter"]
