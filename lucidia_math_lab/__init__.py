"""Lucidia Math Lab modules.

This package exposes several mathematical utilities.  Some of these
utilities depend on optional third party libraries.  Importing the
package previously tried to import all submodules eagerly which caused
an immediate failure if an optional dependency (for example
``networkx`` required by :class:`TrinaryLogicEngine`) was missing.

To make the package more robust we now lazily import submodules only
when their attributes are accessed.  This allows users to work with the
prime exploration helpers without needing the heavier trinary logic
requirements installed.
"""

from __future__ import annotations

from importlib import import_module
from typing import Any
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


_MODULE_MAP = {
    "TrinaryLogicEngine": ("trinary_logic", "TrinaryLogicEngine"),
    "ulam_spiral": ("prime_explorer", "ulam_spiral"),
    "residue_grid": ("prime_explorer", "residue_grid"),
    "fourier_prime_gaps": ("prime_explorer", "fourier_prime_gaps"),
    "RecursiveSandbox": ("recursion_sandbox", "RecursiveSandbox"),
    "superposition": ("sine_wave_codex", "superposition"),
    "classify_wave": ("sine_wave_codex", "classify_wave"),
    "QuantumFinanceSimulator": ("quantum_finance", "QuantumFinanceSimulator"),
}


def __getattr__(name: str) -> Any:
    """Lazily import submodules when their attributes are requested.

    Parameters
    ----------
    name:
        The attribute name to retrieve.

    Raises
    ------
    AttributeError
        If ``name`` is not one of the exposed attributes.
    """

    if name not in _MODULE_MAP:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

    module_name, attr_name = _MODULE_MAP[name]
    module = import_module(f".{module_name}", __name__)
    return getattr(module, attr_name)


def __dir__() -> list[str]:
    """Return available attributes for auto-completion tools."""

    return sorted(list(__all__))
