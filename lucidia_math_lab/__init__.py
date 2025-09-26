"""Lucidia Math Lab modules."""

from .trinary_logic import TrinaryLogicEngine
from .prime_explorer import (
    ulam_spiral,
    residue_grid,
    fourier_prime_gaps,
)
from .recursion_sandbox import RecursiveSandbox
from .sine_wave_codex import (
    superposition,
    classify_wave,
)
from .quantum_finance import QuantumFinanceSimulator

__all__ = [
    "TrinaryLogicEngine",
    "ulam_spiral",
    "residue_grid",
    "fourier_prime_gaps",
    "RecursiveSandbox",
    "superposition",
    "classify_wave",
    "QuantumFinanceSimulator",
]
