"""Client helper for interacting with the collaboration presence bus."""
from __future__ import annotations

import logging
import time
from typing import Any, Mapping, Optional

import requests

try:
    import socketio  # type: ignore
except Exception:  # pragma: no cover - optional runtime dependency
    socketio = None  # type: ignore

LOGGER = logging.getLogger(__name__)


class CollabBusClient:
    """Small helper that wraps socket.io and REST fallbacks."""

    def __init__(self, base_url: str = "http://127.0.0.1:9000", agent: str = "anonymous") -> None:
        self._base_url = base_url.rstrip("/")
        self._agent = agent
        self._socket: Optional[Any] = None
        self._session = requests.Session()

    def connect(self) -> None:
        if socketio is None:
            LOGGER.warning("socketio client missing; REST-only mode")
            return
        if self._socket:
            return
        client = socketio.Client(reconnection=True, reconnection_attempts=3)
        try:
            client.connect(f"{self._base_url}", transports=["websocket", "polling"], wait_timeout=2)
            client.emit("join", {"agent": self._agent, "ts": time.time()})
            self._socket = client
        except Exception as exc:  # pragma: no cover - connection optional
            LOGGER.warning("Failed to connect to collab bus via socket.io: %s", exc)
            self._socket = None

    def emit(self, event: str, payload: Mapping[str, Any]) -> None:
        message = {"agent": self._agent, **payload}
        if self._socket:
            try:
                self._socket.emit(event, message)
                return
            except Exception as exc:  # pragma: no cover - degrade to REST
                LOGGER.warning("socket.io emit failed (%s); falling back to REST", exc)
        self._post_rest(event, message)

    def _post_rest(self, event: str, payload: Mapping[str, Any]) -> None:
        try:
            res = self._session.post(
                f"{self._base_url}/collab/events",
                json={"event": event, "payload": payload},
                timeout=2,
            )
            res.raise_for_status()
        except Exception as exc:  # pragma: no cover - telemetry only
            LOGGER.warning("collab bus REST publish failed: %s", exc)

    def heartbeat(self, focus: Optional[str] = None, branch: Optional[str] = None, metadata: Optional[Mapping[str, Any]] = None) -> None:
        payload: dict[str, Any] = {"ts": time.time(), "metadata": metadata or {}}
        if focus:
            payload["file"] = focus
        if branch:
            payload["branch"] = branch
        self.emit("presence", payload)

    def focus(self, file_path: str, branch: Optional[str] = None, metadata: Optional[Mapping[str, Any]] = None) -> None:
        payload: dict[str, Any] = {
            "ts": time.time(),
            "file": file_path,
            "branch": branch,
            "metadata": metadata or {},
        }
        self.emit("focus", payload)

    def help_request(self, topic: str, metadata: Optional[Mapping[str, Any]] = None) -> None:
        self.emit("help", {"ts": time.time(), "topic": topic, "metadata": metadata or {}})

    def record_decision(self, subject: str, decision: str, metadata: Optional[Mapping[str, Any]] = None) -> None:
        self.emit(
            "decision",
            {
                "ts": time.time(),
                "subject": subject,
                "decision": decision,
                "metadata": metadata or {},
            },
        )
