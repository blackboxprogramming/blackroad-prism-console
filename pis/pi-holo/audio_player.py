#!/usr/bin/env python3
"""MQTT-driven audio playback service for the Pi-Holo."""
from __future__ import annotations

import json
import logging
import os
import signal
import threading
from pathlib import Path
from typing import Any

import pygame
from paho.mqtt import client as mqtt


LOGGER = logging.getLogger("pi-holo.audio")


class MixerController:
    """Wrapper around ``pygame.mixer`` with simple playback semantics."""

    def __init__(self, sounds_dir: Path, *, default_volume: float = 0.8) -> None:
        self.sounds_dir = sounds_dir
        self.sounds_dir.mkdir(parents=True, exist_ok=True)
        self.default_volume = default_volume
        self._lock = threading.Lock()
        self._current_file: str | None = None
        self._init_mixer()

    def _init_mixer(self) -> None:
        try:
            pygame.mixer.init()
        except pygame.error as exc:  # pragma: no cover - requires Raspberry Pi audio stack
            LOGGER.error("failed to initialise audio mixer: %s", exc)
            raise SystemExit(2)

    def play(self, filename: str, *, volume: float | None = None, loop: bool = False) -> None:
        path = self.sounds_dir / filename
        if not path.is_file():
            LOGGER.warning("audio file missing: %s", path)
            return

        volume = self._clamp_volume(volume if volume is not None else self.default_volume)

        with self._lock:
            try:
                pygame.mixer.music.load(str(path))
            except pygame.error as exc:
                LOGGER.error("unable to load %s: %s", path, exc)
                return

            loops = -1 if loop else 0
            try:
                pygame.mixer.music.set_volume(volume)
                pygame.mixer.music.play(loops)
            except pygame.error as exc:
                LOGGER.error("unable to play %s: %s", path, exc)
                return

            self._current_file = filename
            LOGGER.info(
                "playing %s (volume=%.2f loop=%s)",
                filename,
                volume,
                "on" if loop else "off",
            )

    def stop(self) -> None:
        with self._lock:
            if not pygame.mixer.music.get_busy():
                return
            pygame.mixer.music.stop()
            LOGGER.info("stopped playback of %s", self._current_file or "<none>")
            self._current_file = None

    @staticmethod
    def _clamp_volume(value: float) -> float:
        return max(0.0, min(1.0, value))


class AudioService:
    """MQTT service that reacts to ``holo/audio`` commands."""

    def __init__(self, controller: MixerController, topic: str) -> None:
        self.controller = controller
        self.topic = topic
        self._client = mqtt.Client(client_id=os.getenv("AUDIO_CLIENT_ID", "pi-holo-audio"))
        username = os.getenv("AUDIO_MQTT_USERNAME")
        if username:
            self._client.username_pw_set(username, password=os.getenv("AUDIO_MQTT_PASSWORD"))
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._stop = threading.Event()

    def connect(self) -> None:
        host = os.getenv("AUDIO_MQTT_HOST", "pi-ops.local")
        port = int(os.getenv("AUDIO_MQTT_PORT", "1883"))
        keepalive = int(os.getenv("AUDIO_MQTT_KEEPALIVE", "60"))
        try:
            self._client.connect(host, port=port, keepalive=keepalive)
        except Exception as exc:  # pragma: no cover - depends on runtime network
            LOGGER.error("failed to connect to MQTT broker %s:%s - %s", host, port, exc)
            raise SystemExit(3)

    def loop_forever(self) -> None:
        self._client.loop_start()
        try:
            while not self._stop.is_set():
                self._stop.wait(1.0)
        except KeyboardInterrupt:
            LOGGER.info("received interrupt, stopping")
        finally:
            self._client.loop_stop()
            self._client.disconnect()
            pygame.mixer.music.stop()
            pygame.mixer.quit()

    def stop(self) -> None:
        self._stop.set()

    # MQTT callbacks -------------------------------------------------
    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: dict[str, Any], rc: int) -> None:
        if rc != 0:
            LOGGER.error("MQTT connection failed with rc=%s", rc)
            return
        LOGGER.info("connected to MQTT broker, subscribing to %s", self.topic)
        client.subscribe(self.topic, qos=1)

    def _on_message(self, _client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except json.JSONDecodeError:
            LOGGER.warning("discarding non-JSON payload on %s", msg.topic)
            return

        if isinstance(payload, dict) and payload.get("stop"):
            self.controller.stop()
            return

        if not isinstance(payload, dict) or "file" not in payload:
            LOGGER.warning("invalid payload on %s: %s", msg.topic, payload)
            return

        filename = str(payload.get("file"))
        volume = payload.get("volume")
        loop_flag = payload.get("loop", False)
        loop = bool(loop_flag)

        try:
            volume_value = float(volume) if volume is not None else None
        except (TypeError, ValueError):
            LOGGER.warning("invalid volume %r, using default", volume)
            volume_value = None

        self.controller.play(filename, volume=volume_value, loop=loop)


def _setup_logging() -> None:
    level = os.getenv("AUDIO_LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def main() -> int:
    _setup_logging()
    sounds_dir = Path(os.getenv("AUDIO_SOUNDS_DIR", "/home/pi/sounds"))
    default_volume = float(os.getenv("AUDIO_DEFAULT_VOLUME", "0.8"))

    controller = MixerController(sounds_dir, default_volume=default_volume)
    topic = os.getenv("AUDIO_TOPIC", "holo/audio")
    service = AudioService(controller, topic)
    service.connect()

    def _handle_signal(_signum: int, _frame: Any) -> None:
        service.stop()

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)
    service.loop_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
