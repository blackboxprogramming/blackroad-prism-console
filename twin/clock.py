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
