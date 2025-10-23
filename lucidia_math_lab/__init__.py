"""Lucidia Math Lab modules with optional backend selection."""

from __future__ import annotations

from importlib import import_module
from typing import Any, Dict, Tuple

__all__ = [
    "TrinaryLogicEngine",
    "ulam_spiral",
    "residue_grid",
    "fourier_prime_gaps",
    "RecursiveSandbox",
    "superposition",
    "classify_wave",
    "QuantumFinanceSimulator",
    "available_backends",
    "backend_names",
    "select_backend",
]

_MODULE_MAP: Dict[str, Tuple[str, str]] = {
    "TrinaryLogicEngine": ("trinary_logic", "TrinaryLogicEngine"),
    "SimpleDiGraph": ("trinary_logic", "SimpleDiGraph"),
    "SimpleEdge": ("trinary_logic", "SimpleEdge"),
    "ulam_spiral": ("prime_explorer", "ulam_spiral"),
    "residue_grid": ("prime_explorer", "residue_grid"),
    "fourier_prime_gaps": ("prime_explorer", "fourier_prime_gaps"),
    "RecursiveSandbox": ("recursion_sandbox", "RecursiveSandbox"),
    "superposition": ("sine_wave_codex", "superposition"),
    "classify_wave": ("sine_wave_codex", "classify_wave"),
    "QuantumFinanceSimulator": ("quantum_finance", "QuantumFinanceSimulator"),
    "available_backends": ("frameworks", "available_backends"),
    "backend_names": ("frameworks", "backend_names"),
    "select_backend": ("frameworks", "select_backend"),
}


def __getattr__(name: str) -> Any:
    if name not in _MODULE_MAP:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    module_name, attr_name = _MODULE_MAP[name]
    module = import_module(f".{module_name}", __name__)
    return getattr(module, attr_name)


def __dir__() -> list[str]:
    return sorted(__all__)
