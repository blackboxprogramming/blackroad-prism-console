"""Minimal sandbox runner for deterministic skill execution."""
from __future__ import annotations
from typing import Any, Callable
import contextlib
import resource
import signal

CPU_TIME_LIMIT = 1  # seconds
MEMORY_LIMIT = 32 * 1024 * 1024  # 32MB


def _limit_resources() -> None:
    resource.setrlimit(resource.RLIMIT_CPU, (CPU_TIME_LIMIT, CPU_TIME_LIMIT))
    resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT, MEMORY_LIMIT))


def run(func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    """Run callable within basic resource limits."""
    with contextlib.ExitStack() as stack:
        stack.callback(signal.signal, signal.SIGXCPU, signal.SIG_DFL)
        _limit_resources()
        return func(*args, **kwargs)
