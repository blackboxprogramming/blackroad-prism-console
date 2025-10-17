"""Camera-backed renderer for the Pi-Holo display.

This module provides two entry points:

* Run as a command line utility to render a single frame or a short
  streaming session using the Raspberry Pi camera.
* Run as a lightweight HTTP service (default behaviour when no mode is
  supplied) that accepts `/snap` and `/stream` POST requests. This makes it
  easy to trigger captures from a laptop or the Prism console without
  shelling into the Pi every time.

The renderer mirrors the captured frame across four quadrants to match the
holographic pyramid layout and writes the result to disk. When the Pi camera
stack is unavailable the renderer produces a placeholder frame with the text
"Camera not available" instead of crashing.
"""
from __future__ import annotations

import argparse
import json
import logging
import signal
import sys
import threading
import time
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np

try:  # pragma: no cover - hardware specific dependency
    from picamera2 import Picamera2
except Exception:  # pragma: no cover - dependency optional on dev machines
    Picamera2 = None  # type: ignore

try:  # pragma: no cover - optional dependency
    from PIL import Image
except Exception:  # pragma: no cover - pillow is optional on the Pi image
    Image = None  # type: ignore

LOGGER = logging.getLogger("holo_render")
DEFAULT_OUTPUT = Path.home() / "holo" / "frames" / "camera.png"
DEFAULT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)


FONT_5X7: Dict[str, Tuple[str, ...]] = {
    " ": (
        "00000",
        "00000",
        "00000",
        "00000",
        "00000",
        "00000",
        "00000",
    ),
    "A": (
        "01110",
        "10001",
        "10001",
        "11111",
        "10001",
        "10001",
        "10001",
    ),
    "B": (
        "11110",
        "10001",
        "10001",
        "11110",
        "10001",
        "10001",
        "11110",
    ),
    "C": (
        "01110",
        "10001",
        "10000",
        "10000",
        "10000",
        "10001",
        "01110",
    ),
    "E": (
        "11111",
        "10000",
        "10000",
        "11110",
        "10000",
        "10000",
        "11111",
    ),
    "I": (
        "01110",
        "00100",
        "00100",
        "00100",
        "00100",
        "00100",
        "01110",
    ),
    "L": (
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "11111",
    ),
    "M": (
        "10001",
        "11011",
        "10101",
        "10101",
        "10001",
        "10001",
        "10001",
    ),
    "N": (
        "10001",
        "11001",
        "10101",
        "10011",
        "10001",
        "10001",
        "10001",
    ),
    "O": (
        "01110",
        "10001",
        "10001",
        "10001",
        "10001",
        "10001",
        "01110",
    ),
    "R": (
        "11110",
        "10001",
        "10001",
        "11110",
        "10100",
        "10010",
        "10001",
    ),
    "T": (
        "11111",
        "00100",
        "00100",
        "00100",
        "00100",
        "00100",
        "00100",
    ),
    "V": (
        "10001",
        "10001",
        "10001",
        "10001",
        "10001",
        "01010",
        "00100",
    ),
}


def _render_text_image(
    text: str,
    *,
    scale: int = 6,
    fg: Tuple[int, int, int] = (255, 255, 255),
    bg: Tuple[int, int, int] = (30, 30, 30),
    padding: int = 12,
) -> np.ndarray:
    """Render a text message to an RGB array using a 5x7 bitmap font."""

    rows: list[np.ndarray] = []
    for line in text.splitlines():
        glyphs: list[np.ndarray] = []
        for char in line.upper():
            pattern = FONT_5X7.get(char, FONT_5X7[" "])
            glyph = np.array([[1 if pixel == "1" else 0 for pixel in row] for row in pattern], dtype=np.uint8)
            glyphs.append(glyph)
            glyphs.append(np.zeros((glyph.shape[0], 1), dtype=np.uint8))
        if glyphs:
            line_bitmap = np.hstack(glyphs[:-1])  # drop trailing spacer
        else:
            line_bitmap = np.zeros((7, 1), dtype=np.uint8)
        rows.append(line_bitmap)
        rows.append(np.zeros((1, line_bitmap.shape[1]), dtype=np.uint8))

    if not rows:
        rows = [np.zeros((7, 1), dtype=np.uint8)]

    bitmap = np.vstack(rows[:-1])  # drop trailing spacer row
    bitmap = np.repeat(np.repeat(bitmap, scale, axis=0), scale, axis=1)

    height, width = bitmap.shape
    canvas = np.zeros((height + padding * 2, width + padding * 2, 3), dtype=np.uint8)
    canvas[..., :] = bg
    for channel, value in enumerate(fg):
        channel_slice = canvas[padding : padding + height, padding : padding + width, channel]
        channel_slice[bitmap == 1] = value
    return canvas


def _save_image(array: np.ndarray, path: Path) -> None:
    """Persist an RGB array to ``path`` using Pillow when available."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if Image is not None:
        Image.fromarray(array).save(path)
        return

    # Fallback to PPM when Pillow is unavailable.
    fallback = path.with_suffix(".ppm")
    height, width, _ = array.shape
    with fallback.open("w", encoding="ascii") as handle:
        handle.write(f"P3\n{width} {height}\n255\n")
        for row in array:
            for pixel in row:
                handle.write(" ".join(str(int(v)) for v in pixel))
                handle.write(" ")
            handle.write("\n")
    LOGGER.warning("Pillow not available, wrote fallback PPM image to %s", fallback)


@dataclass(slots=True)
class CaptureSettings:
    """Capture configuration for snap/stream modes."""

    size: Tuple[int, int] = (720, 720)
    format: str = "RGB888"


class CameraUnavailable(RuntimeError):
    """Raised when the Pi camera stack is missing."""


class HoloRenderer:
    """Renderer that mirrors camera frames into a hologram layout."""

    def __init__(self, output_path: Path, settings: Optional[CaptureSettings] = None) -> None:
        self.output_path = output_path
        self.settings = settings or CaptureSettings()
        self._camera: Optional[Picamera2] = None
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Camera lifecycle helpers
    # ------------------------------------------------------------------
    def _ensure_camera(self) -> Picamera2:
        if Picamera2 is None:
            raise CameraUnavailable("Picamera2 module not available")
        if self._camera is None:
            camera = Picamera2()
            config = camera.create_video_configuration(
                main={"size": self.settings.size, "format": self.settings.format}
            )
            camera.configure(config)
            camera.start()
            time.sleep(0.2)
            self._camera = camera
        return self._camera

    def _stop_camera(self) -> None:
        if self._camera is not None:
            try:
                self._camera.stop()
            except Exception:  # pragma: no cover - defensive cleanup
                LOGGER.exception("Failed to stop camera cleanly")
            self._camera = None

    # ------------------------------------------------------------------
    # Rendering utilities
    # ------------------------------------------------------------------
    def _capture_frame(self) -> np.ndarray:
        camera = self._ensure_camera()
        frame = camera.capture_array()
        if frame.ndim == 2:  # grayscale fallback
            frame = np.stack([frame] * 3, axis=-1)
        return frame

    @staticmethod
    def _compose_hologram(frame: np.ndarray) -> np.ndarray:
        top_left = frame
        top_right = np.flip(frame, axis=1)
        bottom_left = np.flip(frame, axis=0)
        bottom_right = np.flip(top_right, axis=0)
        top = np.hstack((top_left, top_right))
        bottom = np.hstack((bottom_left, bottom_right))
        return np.vstack((top, bottom))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def render_snap(self) -> Path:
        """Capture a single frame and persist the hologram image."""
        with self._lock:
            try:
                frame = self._capture_frame()
                hologram = self._compose_hologram(frame)
                _save_image(hologram, self.output_path)
                LOGGER.info("Captured camera snap to %s", self.output_path)
            except CameraUnavailable:
                LOGGER.warning("Camera unavailable, rendering placeholder frame")
                placeholder = _render_text_image("Camera not available")
                _save_image(placeholder, self.output_path)
            finally:
                self._stop_camera()
        return self.output_path

    def render_stream(self, duration_ms: int, fps: float) -> Path:
        """Stream frames for ``duration_ms`` milliseconds at ``fps``."""
        fps = max(fps, 1.0)
        end_time = time.monotonic() + max(duration_ms, 0) / 1000.0
        delay = 1.0 / fps
        with self._lock:
            frames = 0
            try:
                while time.monotonic() < end_time:
                    try:
                        frame = self._capture_frame()
                        hologram = self._compose_hologram(frame)
                    except CameraUnavailable:
                        LOGGER.warning("Camera unavailable during stream, falling back to placeholder")
                        hologram = _render_text_image("Camera not available")
                        end_time = time.monotonic()  # exit early
                    _save_image(hologram, self.output_path)
                    frames += 1
                    time.sleep(delay)
            finally:
                self._stop_camera()
            LOGGER.info(
                "Streamed %s frames to %s over %.2fs", frames, self.output_path, max(duration_ms, 0) / 1000.0
            )
        return self.output_path

    def render_message(self, message: str) -> Path:
        """Render a text message to the hologram output."""
        with self._lock:
            placeholder = _render_text_image(message)
            _save_image(placeholder, self.output_path)
        LOGGER.info("Rendered message '%s' to %s", message, self.output_path)
        return self.output_path


class _RequestHandler(BaseHTTPRequestHandler):
    renderer: HoloRenderer

    def _json_response(self, payload: Dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802 - http.server naming
        if self.path == "/healthz":
            self._json_response({"ok": True, "camera": Picamera2 is not None})
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def do_POST(self) -> None:  # noqa: N802 - http.server naming
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length) if content_length else b"{}"
        try:
            payload = json.loads(body.decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("payload must be an object")
        except Exception as exc:  # pragma: no cover - defensive
            self._json_response({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return

        if self.path == "/snap":
            path = self.renderer.render_snap()
            self._json_response({"ok": True, "mode": "camera_snap", "path": str(path)})
            return

        if self.path == "/stream":
            duration = int(payload.get("duration_ms", 0))
            fps = float(payload.get("fps", 20))
            path = self.renderer.render_stream(duration, fps)
            self._json_response(
                {"ok": True, "mode": "camera_stream", "path": str(path), "duration_ms": duration, "fps": fps}
            )
            return

        if self.path == "/message":
            message = str(payload.get("message", "")) or "Camera not available"
            path = self.renderer.render_message(message)
            self._json_response({"ok": True, "mode": "message", "path": str(path)})
            return

        self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def log_message(self, fmt: str, *args) -> None:  # noqa: D401 - silence base logging
        LOGGER.debug("HTTP %s - %s", self.address_string(), fmt % args)


def _run_server(renderer: HoloRenderer, host: str, port: int) -> None:
    handler = _RequestHandler
    handler.renderer = renderer
    server = ThreadingHTTPServer((host, port), handler)

    def _shutdown(*_: object) -> None:
        LOGGER.info("Shutting down HTTP server")
        server.shutdown()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)
    LOGGER.info("Starting Pi-Holo camera server on %s:%s", host, port)
    server.serve_forever()


def _parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pi-Holo camera renderer")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to the hologram image output")
    parser.add_argument("--host", default="0.0.0.0", help="Server bind address when running in HTTP mode")
    parser.add_argument("--port", type=int, default=8787, help="Server port when running in HTTP mode")
    parser.add_argument(
        "--message",
        default=None,
        help="Render the provided message instead of a camera capture",
    )

    subparsers = parser.add_subparsers(dest="mode")

    snap_parser = subparsers.add_parser("camera_snap", help="Capture a single frame")
    snap_parser.set_defaults(mode="camera_snap")

    stream_parser = subparsers.add_parser("camera_stream", help="Stream frames for a duration")
    stream_parser.add_argument("duration_ms", type=int, help="Duration in milliseconds")
    stream_parser.add_argument("fps", type=float, help="Target frames per second")
    stream_parser.set_defaults(mode="camera_stream")

    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    args = _parse_args(argv)
    renderer = HoloRenderer(args.output)

    if args.message:
        renderer.render_message(args.message)
        return 0

    if args.mode == "camera_snap":
        renderer.render_snap()
        return 0

    if args.mode == "camera_stream":
        renderer.render_stream(args.duration_ms, args.fps)
        return 0

    try:
        _run_server(renderer, args.host, args.port)
    except KeyboardInterrupt:  # pragma: no cover - interactive shutdown
        LOGGER.info("Interrupted; shutting down")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
