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
from contextlib import contextmanager
from typing import Iterator, List

_active_packs: List[str] = []


def get_active_packs() -> List[str]:
    return list(_active_packs)


@contextmanager
def with_packs(packs: List[str]) -> Iterator[None]:
    """Temporarily activate policy packs for a block of code."""
    global _active_packs
    prev = list(_active_packs)
    _active_packs = list(packs)
    try:
        yield
    finally:
        _active_packs = prev
