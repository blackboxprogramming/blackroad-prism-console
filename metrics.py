from collections import Counter

_counters = Counter()


def emit(name: str) -> None:
    """Increment a named counter."""
    _counters[name] += 1


def sample() -> dict:
    """Return a snapshot of all counters."""
    return dict(_counters)

