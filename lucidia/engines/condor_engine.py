"""Utilities for working with NASA Condor models.

This module provides lightweight helpers that wrap the Condor modelling
interfaces.  The helpers are intentionally small so that unit tests can run
without requiring the real Condor dependency.  The goal is to expose a stable
Python API that can be imported by agents or HTTP routes in constrained
environments.
"""

from __future__ import annotations

import ast
import importlib.util
import sys
import tempfile
from dataclasses import asdict, is_dataclass
from pathlib import Path
from types import ModuleType
from typing import Any, Dict, Optional, Type

try:  # Optional dependency used only at runtime
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover - numpy may be absent
    np = None  # type: ignore

try:  # Condor itself may not be installed in all environments
    import condor  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover - Condor may be absent
    condor = None  # type: ignore

ALLOWED_IMPORTS = {"condor", "math", "numpy", "dataclasses"}
FORBIDDEN_NAMES = {
    "open",
    "os",
    "sys",
    "subprocess",
    "socket",
    "sockets",
    "eval",
    "exec",
    "__import__",
}


def _to_primitive(obj: Any) -> Any:
    """Recursively convert dataclasses and arrays into Python primitives."""

    if is_dataclass(obj):
        return {k: _to_primitive(v) for k, v in asdict(obj).items()}
    if np is not None and isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: _to_primitive(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_to_primitive(v) for v in obj]
    return obj


def validate_model_source(py_text: str) -> None:
    """Validate a user supplied model source string.

    The validator performs a conservative static analysis using :mod:`ast`.
    Only a small allow-list of imports is permitted and several dangerous
    names are rejected.  The intent is to catch obvious misuse before
    executing code in a sandbox.
    """

    tree = ast.parse(py_text)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split(".")[0] not in ALLOWED_IMPORTS:
                    raise ValueError(f"import of '{alias.name}' is not allowed")
        elif isinstance(node, ast.ImportFrom):
            if (node.module or "").split(".")[0] not in ALLOWED_IMPORTS:
                raise ValueError(f"from '{node.module}' import is not allowed")
        elif isinstance(node, ast.Name):
            if node.id in FORBIDDEN_NAMES:
                raise ValueError(f"usage of '{node.id}' is forbidden")
        elif isinstance(node, ast.Attribute):
            if node.attr.startswith("__"):
                raise ValueError("dunder attribute access is forbidden")


def _load_module_from_source(source: str, module_name: str) -> ModuleType:
    """Load a module from source text in an isolated temporary directory."""

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / f"{module_name}.py"
        path.write_text(source, encoding="utf-8")
        spec = importlib.util.spec_from_file_location(module_name, path)
        if spec is None or spec.loader is None:  # pragma: no cover - defensive
            raise ImportError("Could not create import spec for model")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        return module


def load_model_from_source(py_text: str, class_name: str) -> Type[Any]:
    """Validate and load a model class from source code."""

    validate_model_source(py_text)
    module = _load_module_from_source(py_text, "user_model")
    return getattr(module, class_name)


def solve_algebraic(model_cls: Type[Any], **params: Any) -> Any:
    """Instantiate ``model_cls`` and call its ``solve`` method.

    The returned object is converted to basic Python types so that it is
    easy to serialise to JSON.  The function does not require the real
    Condor dependency which keeps unit tests lightweight.
    """

    model = model_cls(**params)
    result = model.solve() if hasattr(model, "solve") else model
    return _to_primitive(result)


def simulate_ode(
    model_cls: Type[Any],
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
    else:  # pragma: no cover - dummy fallback for tests
        result = {}
    return _to_primitive(result)


def optimize(
    problem_cls: Type[Any],
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
    return _to_primitive(result)


__all__ = [
    "load_model_from_source",
    "optimize",
    "simulate_ode",
    "solve_algebraic",
    "validate_model_source",
]
