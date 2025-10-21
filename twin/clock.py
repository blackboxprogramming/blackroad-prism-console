from __future__ import annotations

import os
from datetime import datetime, timedelta


class Clock:
    def __init__(self, seed: int | None = None):
        self.seed = int(seed or os.environ.get("RANDOM_SEED", "0"))
        self.base = datetime.fromtimestamp(self.seed or 0)
        self.offset = 0

    def now(self) -> datetime:
        return self.base + timedelta(seconds=self.offset)

    def set_offset(self, seconds: int) -> None:
        self.offset = seconds


_clock = Clock()


def now() -> datetime:
    return _clock.now()


def set_offset(seconds: int) -> None:
    _clock.set_offset(seconds)
import datetime
import random

import settings


class DeterministicClock:
    """Deterministic clock seeded from settings.RANDOM_SEED."""

    def __init__(self, seed: int = getattr(settings, "RANDOM_SEED", 0)):
        random.seed(seed)
        self._base = datetime.datetime(2000, 1, 1) + datetime.timedelta(
            seconds=random.randint(0, 10_000)
        )
        self._offset = 0

    def set_offset(self, seconds: int) -> None:
        self._offset = seconds

    def now(self, add: int = 0) -> datetime.datetime:
        current = self._base + datetime.timedelta(seconds=self._offset + add)
        self._offset += 1
        return current


_CLOCK = DeterministicClock()


def set_offset(seconds: int) -> None:
    _CLOCK.set_offset(seconds)


def now(offset: int = 0) -> datetime.datetime:
    return _CLOCK.now(offset)
