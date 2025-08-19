"""Wrappers for running NASA Condor models locally.

This module intentionally implements only a very small subset of the
full design proposed in the specification.  The helpers defined here are
sufficient for local experimentation and unit testing.  Advanced
sandboxing, provenance and solver features should be implemented in the
future.
"""

from __future__ import annotations

import ast
from dataclasses import asdict, is_dataclass
from typing import Any, Dict, Optional

try:  # Optional dependency
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover - numpy may be absent
    np = None  # type: ignore

try:  # Condor itself may not be installed in all environments
    import condor  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
    condor = None  # type: ignore

ALLOWED_IMPORTS = {"condor", "math", "numpy", "dataclasses"}


def _ndarray_to_list(value: Any) -> Any:
    """Convert numpy arrays to plain lists for JSON serialisation."""
    if np is not None and isinstance(value, np.ndarray):
        return value.tolist()
    return value


def _to_dict(obj: Any) -> Any:
    """Recursively convert dataclasses and arrays to plain Python types."""
    if is_dataclass(obj):
        return {k: _to_dict(v) for k, v in asdict(obj).items()}
    if isinstance(obj, dict):
        return {k: _to_dict(v) for k, v in obj.items()}
    return _ndarray_to_list(obj)


def validate_model_source(py_text: str) -> None:
    """Perform a very small static analysis pass over ``py_text``.

    The validator only allows a small allowlist of imports and attempts
    to block common dangerous patterns such as use of ``eval`` or direct
    access to magic attributes.  It does *not* guarantee safety; it is a
    lightweight heuristic intended for local use.
    """

    tree = ast.parse(py_text)
    banned = {"open", "os", "sys", "subprocess", "socket", "eval", "exec"}

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            modules = [n.name for n in node.names] if isinstance(node, ast.Import) else [node.module]
            for mod in modules:
                if mod and mod.split(".")[0] not in ALLOWED_IMPORTS:
                    raise ValueError(f"Disallowed import: {mod}")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in banned:
                raise ValueError(f"Forbidden call: {node.func.id}")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise ValueError("Dunder attribute access is not allowed")

    for token in banned:
        if token in py_text:
            raise ValueError(f"Forbidden token found: {token}")


def solve_algebraic(model_cls, **params) -> Any:
    """Instantiate ``model_cls`` and call its ``solve`` method.

    The returned object is converted to basic Python types so that it is
    easy to serialise to JSON.
    """

    model = model_cls(**params)
    result = model.solve() if hasattr(model, "solve") else model
    return _to_dict(result)


def simulate_ode(
    model_cls,
    t_final: float,
    initial: Any,
    params: Optional[Dict[str, Any]] = None,
    events: Any = None,
    modes: Any = None,
) -> Any:
    """Simulate an ODE system if the model exposes a ``simulate`` method."""

    model = model_cls(**(params or {}))
    if hasattr(model, "simulate"):
        result = model.simulate(t_final, initial, events=events, modes=modes)
    else:  # pragma: no cover - dummy fallback
        result = {}
    return _to_dict(result)


def optimize(
    problem_cls,
    initial_guess: Any,
    bounds: Any = None,
    options: Optional[Dict[str, Any]] = None,
) -> Any:
    """Solve an optimisation problem if ``problem_cls`` implements ``solve``."""

    problem = problem_cls()
    if hasattr(problem, "solve"):
        result = problem.solve(initial_guess, bounds=bounds, options=options)
    else:  # pragma: no cover - dummy fallback
        result = {}
    return _to_dict(result)
