"""Agent for running Condor models in a controlled environment.

The :class:`SimulatorAgent` provides a thin wrapper around the helpers in
``lucidia.engines.condor_engine``.  It accepts user supplied model source code,
performs basic validation, and executes the requested intent.  Results of the
last few runs are cached to avoid recomputation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
import json
from typing import Any, Dict

from lucidia.engines.condor_engine import (
    load_model_from_source,
    optimize,
    simulate_ode,
    solve_algebraic,
)

CACHE_SIZE = 5


def _hash_model(source: str, args: Dict[str, Any]) -> str:
    return sha256((source + json.dumps(args, sort_keys=True)).encode()).hexdigest()


@dataclass
class SimulatorAgent:
    """Execute Condor models according to a given intent."""

    cache: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    def _memoise(self, key: str, value: Dict[str, Any]) -> None:
        self.cache[key] = value
        if len(self.cache) > CACHE_SIZE:
            # remove oldest entry
            self.cache.pop(next(iter(self.cache)))

    def run(
        self,
        intent: str,
        model_source: str,
        class_name: str,
        args: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Execute ``intent`` using the provided model source."""

        args = args or {}
        key = _hash_model(model_source, {"intent": intent, **args})
        if key in self.cache:
            return self.cache[key]

        model_cls = load_model_from_source(model_source, class_name)
        if intent == "solve":
            result = solve_algebraic(model_cls, **args)
        elif intent == "simulate":
            result = simulate_ode(
                model_cls,
                args.get("t_final", 1.0),
                args.get("initial", {}),
                args.get("params", {}),
            )
        elif intent == "optimize":
            result = optimize(
                model_cls,  # type: ignore[arg-type]
                args.get("initial_guess", {}),
                args.get("bounds", {}),
                args.get("options", {}),
            )
        else:
            raise ValueError(f"unknown intent '{intent}'")

        self._memoise(key, result)
        return result

