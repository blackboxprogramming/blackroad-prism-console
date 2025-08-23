"""Agent for running Condor models in a controlled environment.

The :class:`SimulatorAgent` wraps helper utilities from
``lucidia.engines.condor_engine`` to execute small simulations and
optimisations.  Results of recent runs are memoised to avoid
recomputation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
import json
from collections import OrderedDict
from typing import Any, Dict

from lucidia.engines.condor_engine import (
    load_model_from_source,
    optimize,
    simulate_ode,
    solve_algebraic,
)

CACHE_SIZE = 5


def _hash_model(source: str, args: Dict[str, Any]) -> str:
    """Create a hash for caching based on source and arguments."""
    return sha256((source + json.dumps(args, sort_keys=True)).encode()).hexdigest()


@dataclass
class SimulatorAgent:
    """Minimal simulator agent used in tests and local demos with an LRU cache."""

    cache: OrderedDict[str, Dict[str, Any]] = field(default_factory=OrderedDict)

    def _memoise(self, key: str, value: Dict[str, Any]) -> None:
        """Store ``value`` under ``key`` keeping cache within ``CACHE_SIZE``."""
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > CACHE_SIZE:
            self.cache.popitem(last=False)

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
            self.cache.move_to_end(key)
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


if __name__ == "__main__":
    agent = SimulatorAgent()
    print("SimulatorAgent ready")
