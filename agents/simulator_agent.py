"""Agent for executing Condor simulations and optimisations.

The implementation provided here is intentionally lightweight.  It
supports the core intents required for experimentation and defers more
advanced logging, sandboxing and streaming features to future work.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict

from lucidia.engines import condor_engine


@dataclass
class SimulatorAgent:
    """Minimal simulator agent used in tests and local demos."""

    cache_size: int = 4
    _cache: Dict[str, Any] = field(default_factory=dict)

    def run(self, intent: str, *args, **kwargs) -> Any:
        """Dispatch to Condor engine helpers based on ``intent``."""
        key = (intent, str(args), str(kwargs))
        if key in self._cache:
            return self._cache[key]

        if intent == "simulate":
            result = condor_engine.simulate_ode(*args, **kwargs)
        elif intent == "optimize":
            result = condor_engine.optimize(*args, **kwargs)
        elif intent == "analyze_trajectory":
            result = condor_engine.solve_algebraic(*args, **kwargs)
        else:
            raise ValueError(f"Unknown intent: {intent}")

        if len(self._cache) >= self.cache_size:
            self._cache.pop(next(iter(self._cache)))
        self._cache[key] = result
        return result
