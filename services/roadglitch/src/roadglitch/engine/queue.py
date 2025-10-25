from __future__ import annotations

import asyncio
from collections import deque
from typing import Any, Callable, Coroutine, Deque, Optional


class InMemoryQueue:
    def __init__(self) -> None:
        self._queue: Deque[Callable[[], Coroutine[Any, Any, None]]] = deque()
        self._event = asyncio.Event()
        self._running = False

    def enqueue(self, task: Callable[[], Coroutine[Any, Any, None]]) -> None:
        self._queue.append(task)
        self._event.set()

    async def run(self) -> None:
        if self._running:
            return
        self._running = True
        while True:
            if not self._queue:
                self._event.clear()
                await self._event.wait()
                continue
            task = self._queue.popleft()
            await task()


__all__ = ["InMemoryQueue"]

