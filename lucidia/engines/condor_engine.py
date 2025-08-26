"""Wrappers for running NASA Condor models locally.

This module intentionally implements only a very small subset of the full
design proposed in the specification. The helpers defined here are sufficient
for local experimentation and unit testing. Advanced sandboxing, provenance
and solver features should be implemented in the future.
"""

from __future__ import annotations

import ast
import importlib.util
import sys
import tempfile
from dataclasses import asdict, is_dataclass
from pathlib import Path
from types import ModuleType
from typing import Any, Dict, Type

try:  # pragma: no cover - optional dependency
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover - numpy may be absent
    np = None  # type: ignore

try:  # pragma: no cover - optional dependency
    import condor  # type: ignore
except Exception:  # pragma: no cover - condor may be absent in CI
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


def _dataclass_to_dict(obj: Any) -> Any:
    """Recursively convert dataclasses and numpy arrays into primitives.

    This helper ensures that results are JSON serialisable. ``numpy`` arrays
    are transformed into Python lists.
    """

    if is_dataclass(obj):
        return {k: _dataclass_to_dict(v) for k, v in asdict(obj).items()}
    if np is not None and isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (list, tuple, set)):
        return [_dataclass_to_dict(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _dataclass_to_dict(v) for k, v in obj.items()}
    return obj


def validate_model_source(py_text: str) -> None:
    """Validate a user supplied model source string.

    The validator performs a conservative static analysis using ``ast``. Only
    a small allow-list of imports is permitted and several dangerous names are
    rejected. The intent is to catch obvious misuse before executing code in a
    sandbox.
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
                raise ValueError(f"use of '{node.id}' is forbidden")
        elif isinstance(node, ast.Attribute):
            if node.attr.startswith("__"):
                raise ValueError("dunder attribute access is forbidden")

    for token in FORBIDDEN_NAMES:
        if token in py_text:
            raise ValueError(f"forbidden token found: {token}")


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
    """Validate and load a model class from source code.

    Parameters
    ----------
    py_text:
        Python source defining the model class.
    class_name:
        Name of the class within the module that should be returned.
    """

    validate_model_source(py_text)
    module = _load_module_from_source(py_text, "user_model")
    return getattr(module, class_name)


def solve_algebraic(model_cls: Type[Any], **params: Any) -> Dict[str, Any]:
    """Instantiate ``model_cls`` and call its ``solve`` method.

    The returned object is converted to basic Python types so that it is
    easy to serialise to JSON.
    """

    model = model_cls(**params)
    result = model.solve() if hasattr(model, "solve") else model
    return _dataclass_to_dict(result)


def simulate_ode(
    model_cls: Type[Any],
    t_final: float,
    initial: Dict[str, Any],
    params: Dict[str, Any] | None = None,
    events: Any | None = None,
    modes: Any | None = None,
) -> Dict[str, Any]:
    """Simulate an ``ODESystem`` until ``t_final`` if the model supports it."""

    model = model_cls(**(params or {}))
    if hasattr(model, "simulate"):
        result = model.simulate(t_final, initial, events=events, modes=modes)
    else:  # pragma: no cover - dummy fallback
        result = {}
    return _dataclass_to_dict(result)


def optimize(
    problem_cls: Type[Any],
    initial_guess: Dict[str, Any],
    bounds: Dict[str, Any] | None = None,
    options: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Solve an optimisation problem if ``problem_cls`` implements ``solve``."""

    problem = problem_cls()
    if hasattr(problem, "solve"):
        result = problem.solve(initial_guess, bounds=bounds, options=options)
    else:  # pragma: no cover - dummy fallback
        result = {}
    return _dataclass_to_dict(result)

