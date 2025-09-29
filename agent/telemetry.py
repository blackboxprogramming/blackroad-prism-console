"""Lightweight telemetry helpers for the BlackRoad dashboard."""

from __future__ import annotations

import asyncio
import random
import time
from collections import deque
from typing import Any, AsyncIterator, Deque, Dict, Iterable, List

_TIMELINE: Deque[Dict[str, Any]] = deque(
    [
        {
            "id": 1,
            "title": "Deployment complete",
            "desc": "Prism console deployed to staging",
            "ts": time.time() - 1800,
        },
        {
            "id": 2,
            "title": "Notebook synced",
            "desc": "Jetson telemetry heartbeat registered",
            "ts": time.time() - 1200,
        },
        {
            "id": 3,
            "title": "Code review finished",
            "desc": "Merged agent orchestrator patch",
            "ts": time.time() - 600,
        },
    ],
    maxlen=200,
)
_TASKS: List[Dict[str, Any]] = [
    {"id": 1, "title": "Wire Jetson metrics", "status": "in-progress"},
    {"id": 2, "title": "Audit API keys", "status": "pending"},
]
_COMMITS: List[Dict[str, Any]] = [
    {
        "id": "f9a3c21",
        "author": "codex",
        "title": "Improve agent resilience",
        "ts": time.time() - 2600,
    }
]
_STATE: Dict[str, Any] = {
    "wallet": 1.20,
    "agents": {"Phi": True, "GPT": True, "Mistral": True},
    "build": 63,
}


def timeline() -> List[Dict[str, Any]]:
    return list(_TIMELINE)


def tasks() -> List[Dict[str, Any]]:
    return list(_TASKS)


def commits() -> List[Dict[str, Any]]:
    return list(_COMMITS)


def state() -> Dict[str, Any]:
    return dict(_STATE)


def record_activity(title: str, desc: str) -> Dict[str, Any]:
    entry = {
        "id": int(time.time() * 1000),
        "title": title,
        "desc": desc,
        "ts": time.time(),
    }
    _TIMELINE.appendleft(entry)
    return entry


async def stream() -> AsyncIterator[Dict[str, Any]]:
    rng = random.Random()
    wallet = float(_STATE.get("wallet", 0))
    build = float(_STATE.get("build", 0))
    while True:
        cpu = rng.uniform(20, 90)
        mem = rng.uniform(30, 80)
        gpu = rng.uniform(10, 95)
        yield {"type": "metrics", "cpu": cpu, "mem": mem, "gpu": gpu}

        if _TIMELINE and rng.random() < 0.35:
            item = rng.choice(list(_TIMELINE))
            yield {"type": "activity", "item": item}

        if rng.random() < 0.25:
            build = min(100.0, build + rng.uniform(0.5, 2.5))
            _STATE["build"] = build
            yield {"type": "build", "progress": build}

        if rng.random() < 0.2:
            delta = rng.uniform(-0.05, 0.08)
            wallet = max(0.0, wallet + delta)
            _STATE["wallet"] = round(wallet, 2)
            yield {"type": "wallet", "balance": _STATE["wallet"]}

        await asyncio.sleep(1.5)
