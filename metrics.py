from collections import Counter

METRICS = Counter()


def record(event: str) -> None:
    METRICS[event] += 1
