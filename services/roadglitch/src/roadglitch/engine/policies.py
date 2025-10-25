from __future__ import annotations

import asyncio
import random
from typing import Optional

from .types import NodeSpec, Policies


class RetryPolicy:
    def __init__(self, *, max_attempts: int, backoff_ms: int) -> None:
        self.max_attempts = max(1, max_attempts)
        self.backoff_ms = max(0, backoff_ms)

    async def backoff(self, attempt: int) -> None:
        if attempt <= 1:
            return
        delay = (self.backoff_ms / 1000.0) * (2 ** (attempt - 2))
        delay = delay * random.uniform(0.8, 1.2)
        await asyncio.sleep(delay)


def resolve_retry_policy(node_id: str, spec: NodeSpec, policies: Policies) -> RetryPolicy:
    node_policy = policies.retries.get(node_id)
    default = policies.retries.get("default")
    chosen = node_policy or default
    if chosen:
        return RetryPolicy(max_attempts=chosen.max + 1, backoff_ms=chosen.backoff_ms)
    return RetryPolicy(max_attempts=1, backoff_ms=0)


__all__ = ["RetryPolicy", "resolve_retry_policy"]

