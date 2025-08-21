"""Core cognitive primitives for Lucidia.

This module defines a tiny `LucidiaBrain` class that can register
processing steps and execute them sequentially.  It acts as a very small
placeholder for more sophisticated reasoning engines.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any, List


class LucidiaBrain:
    """Simple pipeline-based brain for Lucidia.

    Functions registered via :meth:`register` are called in the order they
    were added when :meth:`think` is invoked.  Each function receives the
    current value and returns the next value.
    """

    def __init__(self) -> None:
        self._steps: List[Callable[[Any], Any]] = []

    def register(self, func: Callable[[Any], Any]) -> None:
        """Register a processing step.

        Parameters
        ----------
        func:
            A callable that accepts a single argument and returns the
            transformed value.
        """

        self._steps.append(func)

    def think(self, value: Any) -> Any:
        """Run the registered steps on ``value``.

        Parameters
        ----------
        value:
            Initial input to the pipeline.

        Returns
        -------
        Any
            The result after all steps have been applied.
        """

        for step in self._steps:
            value = step(value)
        return value
