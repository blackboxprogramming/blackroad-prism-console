"""Number theory helpers."""
from math import factorial


def triangular(n: int) -> int:
    """Return the n-th triangular number."""
    return n * (n + 1) // 2


def factorial_demo(n: int) -> int:
    """Expose factorial for demos."""
    return factorial(n)
