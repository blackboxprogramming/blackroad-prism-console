from __future__ import annotations

from contextlib import contextmanager
from typing import List

ACTIVE_PACKS: List[str] = []


@contextmanager
def with_packs(packs: List[str]):
    global ACTIVE_PACKS
    previous = ACTIVE_PACKS.copy()
    ACTIVE_PACKS = packs
    try:
        yield
    finally:
        ACTIVE_PACKS = previous
