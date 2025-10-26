from __future__ import annotations

import asyncio
from collections import deque
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Deque

from ..observability.metrics import SSE_CLIENTS


class SSEBroadcaster:
    def __init__(self, route: str, max_clients: int = 100) -> None:
        self.route = route
        self.max_clients = max_clients
        self.clients: Deque[asyncio.Queue[str]] = deque()
        self.lock = asyncio.Lock()

    async def publish(self, message: str) -> None:
        async with self.lock:
            for queue in list(self.clients):
                await queue.put(message)

    @asynccontextmanager
    async def subscribe(self) -> AsyncGenerator[asyncio.Queue[str], None]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        async with self.lock:
            self.clients.append(queue)
            while len(self.clients) > self.max_clients:
                self.clients.popleft()
        SSE_CLIENTS.labels(route=self.route).set(len(self.clients))
        try:
            yield queue
        finally:
            async with self.lock:
                if queue in self.clients:
                    self.clients.remove(queue)
            SSE_CLIENTS.labels(route=self.route).set(len(self.clients))


__all__ = ["SSEBroadcaster"]
