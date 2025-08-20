"""Self-consistency verifier for traces."""
from __future__ import annotations
from collections import Counter
from pathlib import Path
from typing import Iterable

from .trinary import TruthValue


CONTRADICTION_LOG = Path("contradictions.log")


def majority(values: Iterable[TruthValue]) -> TruthValue:
    """Return majority truth value, UNKNOWN on tie."""
    counts = Counter(values)
    if not counts:
        return TruthValue.UNKNOWN
    best = counts.most_common()
    if len(best) > 1 and best[0][1] == best[1][1]:
        return TruthValue.UNKNOWN
    return best[0][0]


def assert_truth(value: TruthValue, message: str) -> None:
    """Log to contradiction file on failed assertion."""
    if value == TruthValue.FALSE:
        CONTRADICTION_LOG.write_text(f"ASSERT FAILED: {message}\n")
