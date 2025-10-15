"""MQTT-backed display loop for the Pi Zero simulator panel.

This module connects to an MQTT broker, consumes simple JSON payloads,
and renders them using pygame. It supports lightweight text and image
frames so the Pi Zero can act as a tiny status board or signage display.

Usage example::

    python sim_display.py --host mqtt.local --topic lab/pi-zero/display

"""
from __future__ import annotations

import argparse
import base64
import io
import json
import logging
import os
import signal
import sys
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Optional, Sequence, Tuple

import paho.mqtt.client as mqtt
import pygame
from PIL import Image, UnidentifiedImageError

LOGGER = logging.getLogger("pi_zero_display")
DEFAULT_TOPIC = "pi-zero/display"
DEFAULT_FPS = 12
DEFAULT_SIZE = (480, 320)
TEXT_TYPES = {"text"}
IMAGE_TYPES = {"image"}


@dataclass(slots=True)
class DisplayState:
    """Current render target for the display loop."""

    surface: pygame.Surface
    background: Tuple[int, int, int] = (0, 0, 0)
    updated_at: float = field(default_factory=time.monotonic)


class PayloadError(RuntimeError):
    """Raised when an invalid payload is encountered."""


class DisplayClient:
    """High level wrapper around MQTT + pygame event loop."""

    def __init__(
        self,
        host: str,
        port: int,
        topic: str,
        fullscreen: bool,
        fps: int,
        size: Tuple[int, int],
        username: Optional[str] = None,
        password: Optional[str] = None,
    ) -> None:
        self._host = host
        self._port = port
        self._topic = topic
        self._fps = max(1, fps)
        self._size = size
        self._fullscreen = fullscreen
        self._username = username
        self._password = password
        self._client = mqtt.Client()
        if username:
            self._client.username_pw_set(username=username, password=password)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect
        self._lock = threading.Lock()
        self._state: Optional[DisplayState] = None
        self._running = threading.Event()
        self._running.set()
        self._clock: Optional[pygame.time.Clock] = None
        self._surface: Optional[pygame.Surface] = None

    # ------------------------------------------------------------------
    # MQTT lifecycle
    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: dict, rc: int) -> None:
        if rc != 0:
            LOGGER.error("MQTT connection failed with rc=%s", rc)
            return
        LOGGER.info("Connected to MQTT broker at %s:%s", self._host, self._port)
        client.subscribe(self._topic)
        LOGGER.info("Subscribed to topic '%s'", self._topic)

    def _on_disconnect(self, _client: mqtt.Client, _userdata: Any, rc: int) -> None:
        if rc != 0:
            LOGGER.warning("Unexpected MQTT disconnect (rc=%s)", rc)

    def _on_message(self, _client: mqtt.Client, _userdata: Any, message: mqtt.MQTTMessage) -> None:
        payload = message.payload.decode("utf-8", errors="ignore").strip()
        LOGGER.debug("Received payload on %s: %s", message.topic, payload)
        if not payload:
            LOGGER.warning("Ignoring empty payload")
            return
        try:
            data = json.loads(payload)
            surface, bg = self._render_payload(data)
        except (json.JSONDecodeError, PayloadError) as exc:
            LOGGER.error("Invalid payload: %s", exc)
            return
        with self._lock:
            if self._surface is None:
                LOGGER.debug("Surface not initialised; dropping payload")
                return
            self._state = DisplayState(surface=surface, background=bg)

    # ------------------------------------------------------------------
    # Rendering helpers
    def _render_payload(self, data: dict[str, Any]) -> tuple[pygame.Surface, Tuple[int, int, int]]:
        payload_type = data.get("type")
        if payload_type in TEXT_TYPES:
            return self._render_text(data)
        if payload_type in IMAGE_TYPES:
            return self._render_image(data)
        raise PayloadError(f"unsupported payload type: {payload_type!r}")

    def _render_text(self, data: dict[str, Any]) -> tuple[pygame.Surface, Tuple[int, int, int]]:
        text = str(data.get("text", "")).strip()
        if not text:
            raise PayloadError("text payload missing 'text'")
        color = self._parse_color(data.get("color"), default=(255, 255, 255))
        background = self._parse_color(data.get("bg"), default=(0, 0, 0))
        font_size = int(data.get("size", 64))
        font = pygame.font.SysFont("dejavusans", font_size)
        words = text.split()
        lines = self._wrap_words(font, words, self._size[0])
        surface = pygame.Surface(self._size)
        surface.fill(background)
        line_height = font.get_linesize()
        total_height = len(lines) * line_height
        y = max((self._size[1] - total_height) // 2, 0)
        for line in lines:
            rendered = font.render(line, True, color)
            x = max((self._size[0] - rendered.get_width()) // 2, 0)
            surface.blit(rendered, (x, y))
            y += line_height
        return surface, background

    def _render_image(self, data: dict[str, Any]) -> tuple[pygame.Surface, Tuple[int, int, int]]:
        b64_data = data.get("b64")
        if not isinstance(b64_data, str) or not b64_data:
            raise PayloadError("image payload missing 'b64'")
        try:
            blob = base64.b64decode(b64_data)
        except (base64.binascii.Error, ValueError) as exc:
            raise PayloadError(f"invalid base64 payload: {exc}") from exc
        try:
            with Image.open(io.BytesIO(blob)) as img:
                img = img.convert("RGB")
                img = img.resize(self._size, Image.Resampling.LANCZOS)
                mode = img.mode
                data_bytes = img.tobytes()
        except (UnidentifiedImageError, OSError) as exc:
            raise PayloadError(f"invalid image payload: {exc}") from exc
        surface = pygame.image.fromstring(data_bytes, self._size, mode)
        return surface, (0, 0, 0)

    def _wrap_words(self, font: pygame.font.Font, words: Sequence[str], width: int) -> list[str]:
        lines: list[str] = []
        current: list[str] = []
        for word in words:
            test = " ".join(current + [word]).strip()
            if font.size(test)[0] <= width:
                current.append(word)
                continue
            if not current:  # extremely long single word
                lines.append(word)
                current = []
                continue
            lines.append(" ".join(current))
            current = [word]
        if current:
            lines.append(" ".join(current))
        if not lines:
            lines.append("")
        return lines

    def _parse_color(self, value: Any, default: Tuple[int, int, int]) -> Tuple[int, int, int]:
        if isinstance(value, Sequence) and len(value) == 3:
            try:
                rgb = tuple(int(max(0, min(255, int(c)))) for c in value)  # type: ignore[arg-type]
                return rgb  # type: ignore[return-value]
            except (TypeError, ValueError):
                pass
        return default

    # ------------------------------------------------------------------
    # Public API
    def run(self) -> None:
        LOGGER.info("Initialising pygame display")
        pygame.init()
        flags = pygame.FULLSCREEN if self._fullscreen else 0
        screen = pygame.display.set_mode(self._size, flags)
        pygame.display.set_caption("Pi Zero Display")
        pygame.mouse.set_visible(False)
        self._clock = pygame.time.Clock()
        self._surface = pygame.Surface(self._size)
        self._surface.fill((0, 0, 0))
        self._state = DisplayState(surface=self._surface, background=(0, 0, 0))

        signal.signal(signal.SIGTERM, self._handle_exit)
        signal.signal(signal.SIGINT, self._handle_exit)

        LOGGER.info("Connecting to MQTT broker %s:%s", self._host, self._port)
        self._client.connect(self._host, self._port, keepalive=60)
        thread = threading.Thread(target=self._client.loop_forever, name="mqtt-loop", daemon=True)
        thread.start()

        try:
            while self._running.is_set():
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        LOGGER.info("Pygame quit event received")
                        self._running.clear()
                with self._lock:
                    state = self._state
                if state is not None:
                    screen.fill(state.background)
                    screen.blit(state.surface, (0, 0))
                    pygame.display.flip()
                if self._clock:
                    self._clock.tick(self._fps)
        finally:
            LOGGER.info("Shutting down display client")
            self._running.clear()
            self._client.disconnect()
            pygame.quit()

    def _handle_exit(self, _signum: int, _frame: Optional[Any]) -> None:
        LOGGER.info("Exit signal received")
        self._running.clear()


# ----------------------------------------------------------------------
def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pi Zero MQTT display simulator")
    parser.add_argument("--host", default=os.environ.get("PI_ZERO_MQTT_HOST", "localhost"), help="MQTT broker hostname")
    parser.add_argument("--port", default=int(os.environ.get("PI_ZERO_MQTT_PORT", 1883)), type=int, help="MQTT broker port")
    parser.add_argument("--topic", default=os.environ.get("PI_ZERO_MQTT_TOPIC", DEFAULT_TOPIC), help="MQTT topic to subscribe to")
    parser.add_argument("--username", default=os.environ.get("PI_ZERO_MQTT_USERNAME"), help="MQTT username")
    parser.add_argument("--password", default=os.environ.get("PI_ZERO_MQTT_PASSWORD"), help="MQTT password")
    parser.add_argument(
        "--size",
        default=os.environ.get("PI_ZERO_DISPLAY_SIZE", f"{DEFAULT_SIZE[0]}x{DEFAULT_SIZE[1]}"),
        help="Display resolution WIDTHxHEIGHT",
    )
    parser.add_argument("--fullscreen", action="store_true", default=str(os.environ.get("PI_ZERO_FULLSCREEN", "0")) == "1", help="Run fullscreen")
    parser.add_argument("--fps", default=int(os.environ.get("PI_ZERO_FPS", DEFAULT_FPS)), type=int, help="Target frames per second")
    parser.add_argument("--log-level", default=os.environ.get("PI_ZERO_LOG_LEVEL", "INFO"))
    return parser.parse_args(argv)


def parse_size(text: str) -> Tuple[int, int]:
    try:
        width_text, height_text = text.lower().split("x", 1)
        width = max(1, int(width_text))
        height = max(1, int(height_text))
    except (ValueError, AttributeError):
        raise argparse.ArgumentTypeError(f"invalid size specification: '{text}'") from None
    return width, height


def configure_logging(level_text: str) -> None:
    level = getattr(logging, level_text.upper(), logging.INFO)
    logging.basicConfig(level=level, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    try:
        size = parse_size(args.size)
    except argparse.ArgumentTypeError as exc:
        print(exc, file=sys.stderr)
        return 2
    configure_logging(args.log_level)
    client = DisplayClient(
        host=args.host,
        port=args.port,
        topic=args.topic,
        fullscreen=args.fullscreen,
        fps=args.fps,
        size=size,
        username=args.username,
        password=args.password,
    )
    try:
        client.run()
    except KeyboardInterrupt:
        LOGGER.info("Keyboard interrupt received")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
