from collections import Counter

metrics = Counter()


def incr(name: str) -> None:
    """Increment a named metric counter."""
    metrics[name] += 1
