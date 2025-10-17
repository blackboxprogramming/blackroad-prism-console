#!/usr/bin/env python3
"""MQTT heartbeat logger for the Pi-Ops node."""
from __future__ import annotations

import json
import logging
import os
import signal
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt

LOGGER = logging.getLogger("pi_ops.heartbeat")


def expand_path(path: str) -> Path:
    """Resolve a user-provided path into a Path object."""
    return Path(os.path.expanduser(path)).resolve()


def ensure_log_dir(base: Path) -> Path:
    """Create the logging directory if it does not already exist."""
    base.mkdir(parents=True, exist_ok=True)
    return base


class HeartbeatLogger:
    """Subscribe to heartbeat topics and append JSONL logs."""

    def __init__(self) -> None:
        self.host = os.environ.get("MQTT_HOST", "localhost")
        self.port = int(os.environ.get("MQTT_PORT", "1883"))
        self.topic = os.environ.get("MQTT_TOPIC", "system/heartbeat/#")
        log_dir = os.environ.get("HB_LOG_DIR", "~/pi-ops/logs")
        self.log_dir = ensure_log_dir(expand_path(log_dir))
        self.log_file = self.log_dir / "heartbeat.jsonl"
        self.client = mqtt.Client()
        username = os.environ.get("MQTT_USERNAME")
        password = os.environ.get("MQTT_PASSWORD")
        if username:
            self.client.username_pw_set(username, password or None)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def start(self) -> None:
        """Begin the MQTT loop and wait for incoming messages."""
        LOGGER.info("Connecting to MQTT broker %s:%s", self.host, self.port)
        self.client.connect(self.host, self.port, keepalive=60)
        self.client.loop_start()
        signal.signal(signal.SIGTERM, self._graceful_exit)
        signal.signal(signal.SIGINT, self._graceful_exit)
        # Block forever while the background loop handles callbacks
        signal.pause()

    def _graceful_exit(self, *_: Any) -> None:
        LOGGER.info("Shutting down heartbeat logger")
        self.client.loop_stop()
        self.client.disconnect()
        sys.exit(0)

    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: Any, rc: int) -> None:
        if rc != 0:
            LOGGER.error("MQTT connection failed with result code %s", rc)
            sys.exit(1)
        LOGGER.info("Connected to MQTT broker, subscribing to %s", self.topic)
        client.subscribe(self.topic)

    def _on_message(self, _client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage) -> None:
        payload = self._parse_payload(msg.payload)
        entry = {
            "topic": msg.topic,
            "received_at": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        with self.log_file.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
        LOGGER.debug("Logged heartbeat message from %s", msg.topic)

    @staticmethod
    def _parse_payload(raw: bytes) -> Any:
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            return {"raw": list(raw)}
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"text": text}


def configure_logging() -> None:
    level = logging.INFO
    if os.environ.get("HB_DEBUG"):
        level = logging.DEBUG
    logging.basicConfig(level=level, format="%(asctime)s [%(levelname)s] %(message)s")


def main() -> None:
    configure_logging()
    HeartbeatLogger().start()


if __name__ == "__main__":
    main()
