"""Utilities for working with Condor models.

This module provides light‑weight helpers that wrap Condor's modeling
interfaces.  The functions are intentionally small so the heavy lifting
remains within the Condor library itself.  The goal is to expose a stable
Python API that can be called from agents or HTTP routes without pulling in
any remote resources.

The actual Condor package is optional at import time so the repository can be
used in environments where the dependency is not yet installed.  Runtime
errors are raised if the helpers are called without Condor being available.
"""

from __future__ import annotations

from dataclasses import asdict, is_dataclass
from pathlib import Path
import ast
import importlib.util
import json
import sys
import tempfile
from types import ModuleType
from typing import Any, Dict, Type

try:  # pragma: no cover - optional dependency
    import numpy as np
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
    """Recursively convert dataclasses and ``numpy`` arrays into primitives.

    This helper ensures that results are JSON serialisable.  ``numpy`` arrays
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

    The validator performs a conservative static analysis using ``ast``.  Only
    a small allow‑list of imports is permitted and several dangerous names are
    rejected.  The intent is to catch obvious misuse before executing code in a
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
    cls = getattr(module, class_name)
    return cls


def solve_algebraic(model_cls: Type[Any], **params: Any) -> Dict[str, Any]:
    """Solve a Condor ``AlgebraicSystem`` model.

    The function instantiates ``model_cls`` with ``params`` and calls its
    ``solve`` method.  Results are converted into a JSON friendly dictionary.
    """

    if condor is None:  # pragma: no cover - runtime guard
        raise RuntimeError("Condor is not installed")
    model = model_cls(**params)
    solution = model.solve()
    return _dataclass_to_dict(solution)


def simulate_ode(
    model_cls: Type[Any],
    t_final: float,
    initial: Dict[str, Any],
    params: Dict[str, Any],
    events: Any | None = None,
    modes: Any | None = None,
) -> Dict[str, Any]:
    """Simulate an ``ODESystem`` until ``t_final``.

    The call simply forwards to the model's ``simulate`` method.  The return
    value is serialised via :func:`_dataclass_to_dict`.
    """

    if condor is None:  # pragma: no cover - runtime guard
        raise RuntimeError("Condor is not installed")
    model = model_cls(**params)
    result = model.simulate(t_final, initial, events=events, modes=modes)
    return _dataclass_to_dict(result)


def optimize(
    problem_cls: Type[Any],
    initial_guess: Dict[str, Any],
    bounds: Dict[str, Any],
    options: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Solve an ``OptimizationProblem`` and return a serialisable dictionary."""

    if condor is None:  # pragma: no cover - runtime guard
        raise RuntimeError("Condor is not installed")
    problem = problem_cls()
    result = problem.solve(initial_guess=initial_guess, bounds=bounds, options=options)
    return _dataclass_to_dict(result)

