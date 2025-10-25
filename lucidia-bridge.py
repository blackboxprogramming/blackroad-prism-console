#!/usr/bin/env python3
"""Bidirectional bridge between ReflexBus and the Prism EventBus."""

from __future__ import annotations

import asyncio
import json
import logging
import os
from collections import deque
from copy import deepcopy
from pathlib import Path
from time import perf_counter
from typing import Any, Deque, Dict, Iterable, Mapping, MutableMapping

import websockets
from websockets import WebSocketClientProtocol

from lucidia.intelligence.events import make_event, validate_event
from lucidia.reflex import BUS, start as start_reflex

LOGGER = logging.getLogger("lucidia.bridge")
LOGGER.setLevel(logging.INFO)
_handler = logging.StreamHandler()
_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
LOGGER.addHandler(_handler)

BRIDGE_URL = os.environ.get("LUCIDIA_BRIDGE_URL", "ws://127.0.0.1:4000/api/event/bridge")
QUEUE_PATH = Path(os.environ.get("LUCIDIA_BRIDGE_QUEUE", "logs/lucidia_bridge_queue.jsonl"))
QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
TOPIC_PREFIXES: tuple[str, ...] = (
    "observations.",
    "intents.",
    "actions.",
    "guardian.",
    "codex.",
    "memory.",
)


class OfflineQueue:
    """Durable JSONL queue for offline replay."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._queue: Deque[Dict[str, Any]] = deque()
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return
        try:
            with self._path.open("r", encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        payload = json.loads(line)
                        self._queue.append(payload)
                    except json.JSONDecodeError:
                        LOGGER.warning("Skipping corrupt offline queue line")
        except OSError as exc:
            LOGGER.error("Failed to load offline queue: %s", exc)

    def append(self, event: Mapping[str, Any]) -> None:
        self._queue.append(deepcopy(dict(event)))
        self._persist()

    def ack(self, event_id: str) -> None:
        self._queue = deque(item for item in self._queue if item.get("id") != event_id)
        self._persist()

    def iter(self) -> Iterable[Dict[str, Any]]:
        return tuple(self._queue)

    def _persist(self) -> None:
        try:
            with self._path.open("w", encoding="utf-8") as handle:
                for item in self._queue:
                    handle.write(json.dumps(item) + "\n")
        except OSError as exc:
            LOGGER.error("Unable to persist offline queue: %s", exc)


class LucidiaBridge:
    """Coordinates ReflexBus with the Prism event bridge."""

    def __init__(self) -> None:
        self._outbound: "asyncio.Queue[Dict[str, Any]]" = asyncio.Queue()
        self._pending: Dict[str, float] = {}
        self._queue = OfflineQueue(QUEUE_PATH)
        self._loop: asyncio.AbstractEventLoop | None = None

    # ------------------------------------------------------------------
    def start(self) -> None:
        start_reflex()
        self._register_topics()
        asyncio.run(self._run())

    # ------------------------------------------------------------------
    def _register_topics(self) -> None:
        for prefix in TOPIC_PREFIXES:
            BUS.on(f"{prefix}*", self._on_event)

    # ------------------------------------------------------------------
    def _on_event(self, event: Mapping[str, Any]) -> None:
        if self._loop is None:
            return
        if not isinstance(event, Mapping):
            LOGGER.debug("Ignoring non-mapping event payload")
            return
        topic = event.get("topic")
        if not isinstance(topic, str):
            LOGGER.debug("Ignoring event missing topic: %s", event)
            return
        try:
            validate_event(event)
        except Exception as exc:  # pragma: no cover - guardrail
            LOGGER.error("Dropping invalid event: %s", exc)
            return
        enriched = deepcopy(dict(event))
        meta: MutableMapping[str, Any] = dict(enriched.get("meta", {}))
        bridge_meta = dict(meta.get("bridge", {}))
        bridge_meta.update({"state": "queued"})
        meta["bridge"] = bridge_meta
        enriched["meta"] = meta
        if self._loop.is_closed():
            return
        self._loop.call_soon_threadsafe(self._queue_event, enriched)

    # ------------------------------------------------------------------
    def _queue_event(self, event: Mapping[str, Any]) -> None:
        self._queue.append(event)
        self._pending[event["id"]] = perf_counter()
        self._outbound.put_nowait(dict(event))

    # ------------------------------------------------------------------
    async def _run(self) -> None:
        self._loop = asyncio.get_running_loop()
        while True:
            try:
                await self._pump()
            except asyncio.CancelledError:  # pragma: no cover - lifecycle
                raise
            except Exception as exc:  # pragma: no cover - guardrail
                LOGGER.error("Bridge error: %s", exc)
            await asyncio.sleep(2.0)

    # ------------------------------------------------------------------
    async def _pump(self) -> None:
        LOGGER.info("Connecting to Prism bridge at %s", BRIDGE_URL)
        async with websockets.connect(BRIDGE_URL, ping_interval=20, ping_timeout=20) as ws:
            await self._flush_offline(ws)
            sender = asyncio.create_task(self._sender(ws))
            receiver = asyncio.create_task(self._receiver(ws))
            done, pending = await asyncio.wait({sender, receiver}, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            for task in done:
                task.result()

    # ------------------------------------------------------------------
    async def _flush_offline(self, ws: WebSocketClientProtocol) -> None:
        for item in self._queue.iter():
            await self._outbound.put(dict(item))
        await ws.send(json.dumps({"type": "identify", "role": "lucidia-bridge"}))

    # ------------------------------------------------------------------
    async def _sender(self, ws: WebSocketClientProtocol) -> None:
        while True:
            event = await self._outbound.get()
            meta = dict(event.get("meta", {}))
            bridge_meta = dict(meta.get("bridge", {}))
            bridge_meta.update({"state": "sent"})
            if event["id"] in self._pending:
                bridge_meta["latency_ms"] = None
            meta["bridge"] = bridge_meta
            event["meta"] = meta
            payload = json.dumps({"type": "event", "data": event})
            await ws.send(payload)

    # ------------------------------------------------------------------
    async def _receiver(self, ws: WebSocketClientProtocol) -> None:
        async for message in ws:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                LOGGER.warning("Ignoring malformed message: %s", message)
                continue
            msg_type = data.get("type")
            if msg_type == "ack":
                event_id = data.get("id")
                if isinstance(event_id, str):
                    started = self._pending.pop(event_id, None)
                    if started is not None:
                        latency_ms = (perf_counter() - started) * 1000.0
                        LOGGER.debug("Event %s acked in %.2fms", event_id, latency_ms)
                    self._queue.ack(event_id)
            elif msg_type == "event":
                event = data.get("data")
                if not isinstance(event, Mapping):
                    continue
                try:
                    validate_event(event)
                except Exception as exc:  # pragma: no cover - guardrail
                    LOGGER.error("Remote event failed validation: %s", exc)
                    continue
                BUS.emit(str(event["topic"]), dict(event))
            elif msg_type == "hydrate":
                events = data.get("events", [])
                for event in events:
                    if not isinstance(event, Mapping):
                        continue
                    try:
                        validate_event(event)
                    except Exception:
                        continue
                    BUS.emit(str(event["topic"]), dict(event))
            else:
                LOGGER.debug("Unhandled bridge message: %s", data)


def bootstrap_memory_hydration() -> None:
    """Emit a hydration request to the memory subsystem."""

    event = make_event(
        topic="memory.state.request",
        payload={"reason": "startup"},
        source="lucidia-bridge",
        channel="reflex",
        tags=["startup"],
    )
    BUS.emit(event["topic"], event)


def main() -> None:
    bootstrap_memory_hydration()
    bridge = LucidiaBridge()
    bridge.start()


if __name__ == "__main__":
    main()
