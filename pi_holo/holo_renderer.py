#!/usr/bin/env python3
"""Pi-Holo renderer entry point.

This module renders a single square surface that is mirrored to four quadrants
for a Pepper's Ghost holographic display. Scenes can be controlled via MQTT and
include text, clock, and optional camera feeds.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import queue
import signal
import threading
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Optional, Tuple

import pygame
import pygame.mixer

try:
    import paho.mqtt.client as mqtt  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    mqtt = None  # type: ignore

try:
    import cv2  # type: ignore
except ImportError:  # pragma: no cover - optional dependency
    cv2 = None  # type: ignore

ColorValue = Tuple[int, int, int]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pi-Holo Pepper's Ghost renderer")
    parser.add_argument(
        "--scene-file",
        default=os.getenv("SCENE_FILE", "Scenes/example.json"),
        help="Scene configuration JSON file",
    )
    parser.add_argument(
        "--display-mode",
        choices=("fullscreen", "windowed"),
        default=os.getenv("DISPLAY_MODE", "fullscreen"),
        help="Display mode for the renderer",
    )
    parser.add_argument(
        "--mqtt-host",
        default=os.getenv("MQTT_HOST", "pi-ops.local"),
        help="MQTT broker hostname",
    )
    parser.add_argument(
        "--mqtt-port",
        type=int,
        default=int(os.getenv("MQTT_PORT", "1883")),
        help="MQTT broker port",
    )
    parser.add_argument(
        "--mqtt-topic",
        default=os.getenv("MQTT_TOPIC", "holo/cmd"),
        help="MQTT topic for scene commands",
    )
    parser.add_argument(
        "--audio-topic",
        default=os.getenv("MQTT_AUDIO_TOPIC", "holo/audio"),
        help="MQTT topic for audio playback commands",
    )
    parser.add_argument(
        "--audio-base-path",
        default=os.getenv("AUDIO_BASE_PATH", "Sounds"),
        help="Base directory for audio files",
    )
    parser.add_argument(
        "--disable-audio",
        action="store_true",
        help="Disable audio playback even if pygame mixer is available",
    )
    parser.add_argument(
        "--log-level",
        default=os.getenv("LOG_LEVEL", "INFO"),
        help="Python logging level",
    )
    parser.add_argument(
        "--camera-index",
        type=int,
        default=int(os.getenv("CAMERA_INDEX", "0")),
        help="Camera index to use for the camera scene",
    )
    return parser.parse_args()


@dataclass
class DisplayConfig:
    source_size: int = 540
    fps: int = 30
    background: ColorValue = (0, 0, 0)
    title: str = "Pi-Holo"

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "DisplayConfig":
        source_size = int(payload.get("source_size", cls.source_size))
        fps = int(payload.get("fps", cls.fps))
        background = parse_color(payload.get("background"), cls.background)
        title = str(payload.get("title", cls.title))
        return cls(source_size=source_size, fps=fps, background=background, title=title)


class AudioPlayer:
    """Minimal MQTT-driven audio playback helper."""

    def __init__(self, base_path: Path, disabled: bool = False) -> None:
        self.base_path = base_path
        self.disabled = disabled
        self._lock = threading.Lock()
        self._initialized = False

    def _ensure_initialized(self) -> bool:
        if self.disabled:
            return False
        with self._lock:
            if self._initialized:
                return True
            try:
                pygame.mixer.init()
            except pygame.error as exc:
                logging.warning("Audio mixer initialization failed: %s", exc)
                self.disabled = True
                return False
            self._initialized = True
            return True

    def play(self, payload: Dict[str, Any]) -> None:
        if not isinstance(payload, dict):
            logging.debug("Ignoring non-dict audio payload: %s", payload)
            return
        file_name = payload.get("file")
        volume = payload.get("volume", 1.0)
        if not file_name:
            logging.debug("Audio payload missing file: %s", payload)
            return
        if not self._ensure_initialized():
            return
        try:
            volume_value = float(volume)
        except (TypeError, ValueError):
            volume_value = 1.0
        volume_value = max(0.0, min(1.0, volume_value))
        candidate = Path(str(file_name))
        if not candidate.is_file():
            candidate = (self.base_path / str(file_name)).expanduser()
        if not candidate.is_file():
            logging.warning("Audio file not found: %s", candidate)
            return
        with self._lock:
            try:
                pygame.mixer.music.load(candidate.as_posix())
                pygame.mixer.music.set_volume(volume_value)
                pygame.mixer.music.play()
                logging.debug("Playing audio: %s at volume %.2f", candidate, volume_value)
            except pygame.error as exc:
                logging.warning("Failed to play audio %s: %s", candidate, exc)

    def stop(self) -> None:
        if not self._initialized:
            return
        with self._lock:
            pygame.mixer.music.stop()
            pygame.mixer.quit()
            self._initialized = False


def parse_color(value: Any, fallback: ColorValue) -> ColorValue:
    if isinstance(value, str):
        value = value.strip()
        if value.startswith("#") and len(value) in {4, 7}:
            hex_value = value[1:]
            if len(hex_value) == 3:
                hex_value = "".join(ch * 2 for ch in hex_value)
            try:
                r = int(hex_value[0:2], 16)
                g = int(hex_value[2:4], 16)
                b = int(hex_value[4:6], 16)
                return clamp_color((r, g, b))
            except ValueError:
                return fallback
    if isinstance(value, Iterable):
        try:
            parts = list(value)
        except TypeError:
            parts = []
        if len(parts) >= 3:
            try:
                r, g, b = (int(parts[i]) for i in range(3))
                return clamp_color((r, g, b))
            except (TypeError, ValueError):
                pass
    return fallback


def clamp_color(color: Iterable[int]) -> ColorValue:
    clamped = tuple(max(0, min(255, int(component))) for component in color)
    if len(clamped) != 3:
        raise ValueError("Color must have exactly 3 components")
    return clamped  # type: ignore[return-value]


class BaseScene:
    def __init__(self, name: str, params: Dict[str, Any], display: DisplayConfig) -> None:
        self.name = name
        self.display = display
        self.params: Dict[str, Any] = {}
        self.update_params(params)

    def update_params(self, params: Optional[Dict[str, Any]]) -> None:
        if not params:
            return
        self.params.update(params)

    def render(self, surface: pygame.Surface, dt: float) -> None:  # pragma: no cover - visual
        raise NotImplementedError

    def cleanup(self) -> None:
        """Release external resources."""


class TextScene(BaseScene):
    def __init__(self, name: str, params: Dict[str, Any], display: DisplayConfig) -> None:
        self._font: Optional[pygame.font.Font] = None
        self._font_size: Optional[int] = None
        super().__init__(name, params, display)

    def update_params(self, params: Optional[Dict[str, Any]]) -> None:
        super().update_params(params)
        self.params.setdefault("text", "")
        self.params.setdefault("font_size", 64)
        self.params.setdefault("text_color", self.params.get("color", (255, 255, 255)))
        self.params.setdefault("background", self.display.background)
        self.params["text_color"] = parse_color(self.params.get("text_color"), (255, 255, 255))
        self.params["background"] = parse_color(
            self.params.get("background"), self.display.background
        )
        font_size = int(self.params.get("font_size", 64))
        if font_size != self._font_size:
            self._font = pygame.font.Font(None, font_size)
            self._font_size = font_size

    def render(self, surface: pygame.Surface, dt: float) -> None:  # pragma: no cover - visual
        surface.fill(self.params.get("background", self.display.background))
        text = str(self.params.get("text", ""))
        if not self._font:
            self._font = pygame.font.Font(None, int(self.params.get("font_size", 64)))
        text_color = self.params.get("text_color", (255, 255, 255))
        lines = text.splitlines() or [""]
        rendered_lines = [self._font.render(line, True, text_color) for line in lines]
        total_height = sum(line.get_height() for line in rendered_lines)
        spacing = int(self._font.get_linesize() * 0.2)
        total_height += spacing * (len(rendered_lines) - 1)
        start_y = (surface.get_height() - total_height) // 2
        for line_surface in rendered_lines:
            x = (surface.get_width() - line_surface.get_width()) // 2
            surface.blit(line_surface, (x, start_y))
            start_y += line_surface.get_height() + spacing


class ClockScene(TextScene):
    def render(self, surface: pygame.Surface, dt: float) -> None:  # pragma: no cover - visual
        previous = self.params.get("text")
        fmt = self.params.get("format", "%H:%M:%S")
        try:
            self.params["text"] = datetime.now().strftime(fmt)
        except Exception as exc:  # pragma: no cover - formatting fallback
            logging.warning("Failed to format clock string: %s", exc)
            self.params["text"] = datetime.now().strftime("%H:%M:%S")
        super().render(surface, dt)
        if previous is None:
            self.params.pop("text", None)
        else:
            self.params["text"] = previous


class CameraScene(BaseScene):
    def __init__(
        self,
        name: str,
        params: Dict[str, Any],
        display: DisplayConfig,
        use_camera: bool,
        camera_index: int,
    ) -> None:
        self._capture: Optional["cv2.VideoCapture"] = None
        self._enabled = False
        self._camera_index = camera_index
        self._placeholder_font: Optional[pygame.font.Font] = None
        self._mirror = bool(params.get("mirror", True))
        super().__init__(name, params, display)
        if use_camera and cv2 is not None:
            self._capture = cv2.VideoCapture(camera_index)
            if self._capture is not None and self._capture.isOpened():
                self._enabled = True
            else:
                logging.warning("Camera index %s not available", camera_index)
                if self._capture is not None:
                    self._capture.release()
                    self._capture = None
        elif use_camera:
            logging.warning("OpenCV is not installed; camera scene disabled")

    def update_params(self, params: Optional[Dict[str, Any]]) -> None:
        super().update_params(params)
        self.params.setdefault("background", self.display.background)
        self.params["background"] = parse_color(
            self.params.get("background"), self.display.background
        )
        if params and "mirror" in params:
            self._mirror = bool(params["mirror"])

    def render(self, surface: pygame.Surface, dt: float) -> None:  # pragma: no cover - visual
        surface.fill(self.params.get("background", self.display.background))
        if not self._enabled or self._capture is None:
            self._render_placeholder(surface, "Camera unavailable")
            return
        if not self._capture.isOpened():
            self._render_placeholder(surface, "Camera disconnected")
            return
        ok, frame = self._capture.read()
        if not ok or frame is None:
            self._render_placeholder(surface, "No camera frame")
            return
        if self._mirror:
            frame = cv2.flip(frame, 1)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        if frame.shape[0] != self.display.source_size or frame.shape[1] != self.display.source_size:
            frame = cv2.resize(frame, (self.display.source_size, self.display.source_size))
        frame_surface = pygame.image.frombuffer(
            frame.tobytes(),
            (self.display.source_size, self.display.source_size),
            "RGB",
        )
        surface.blit(frame_surface, (0, 0))

    def _render_placeholder(self, surface: pygame.Surface, message: str) -> None:
        if not self._placeholder_font:
            self._placeholder_font = pygame.font.Font(None, 36)
        text_surface = self._placeholder_font.render(message, True, (200, 200, 200))
        x = (surface.get_width() - text_surface.get_width()) // 2
        y = (surface.get_height() - text_surface.get_height()) // 2
        surface.blit(text_surface, (x, y))

    def cleanup(self) -> None:
        if self._capture is not None:
            self._capture.release()
            self._capture = None


class SceneManager:
    def __init__(
        self,
        config: Dict[str, Any],
        display: DisplayConfig,
        use_camera: bool,
        camera_index: int,
    ) -> None:
        self.display = display
        self._scenes: Dict[str, BaseScene] = {}
        self._active_scene: Optional[str] = None
        for name, params in config.get("scenes", {}).items():
            scene = self._create_scene(name, params or {}, use_camera, camera_index)
            if scene:
                self._scenes[name] = scene
        default_scene = config.get("default_scene")
        if default_scene in self._scenes:
            self._active_scene = default_scene
        elif self._scenes:
            self._active_scene = next(iter(self._scenes))
        else:
            self._active_scene = None
            logging.warning("No scenes defined in configuration")

    def _create_scene(
        self,
        name: str,
        params: Dict[str, Any],
        use_camera: bool,
        camera_index: int,
    ) -> Optional[BaseScene]:
        scene_type = params.get("type", "text").lower()
        if scene_type == "text":
            return TextScene(name, params, self.display)
        if scene_type == "clock":
            return ClockScene(name, params, self.display)
        if scene_type == "camera":
            return CameraScene(name, params, self.display, use_camera, camera_index)
        logging.warning("Unsupported scene type '%s' for scene '%s'", scene_type, name)
        return None

    @property
    def active_scene(self) -> Optional[BaseScene]:
        return self._scenes.get(self._active_scene) if self._active_scene else None

    @property
    def active_scene_name(self) -> Optional[str]:
        return self._active_scene

    def set_active_scene(self, name: str) -> None:
        if name not in self._scenes:
            logging.warning("Scene '%s' is not defined", name)
            return
        self._active_scene = name
        logging.info("Switched to scene '%s'", name)

    def update_scene_params(self, name: str, params: Dict[str, Any]) -> None:
        scene = self._scenes.get(name)
        if not scene:
            logging.warning("Cannot update parameters for undefined scene '%s'", name)
            return
        scene.update_params(params)
        logging.info("Updated scene '%s' parameters: %s", name, params)

    def render(self, surface: pygame.Surface, dt: float) -> None:  # pragma: no cover - visual
        scene = self.active_scene
        if scene is None:
            surface.fill(self.display.background)
            return
        scene.render(surface, dt)

    def shutdown(self) -> None:
        for scene in self._scenes.values():
            scene.cleanup()


class HoloRenderer:
    def __init__(
        self,
        display: DisplayConfig,
        scene_manager: SceneManager,
        command_queue: "queue.Queue[Dict[str, Any]]",
        args: argparse.Namespace,
        audio_player: AudioPlayer,
    ) -> None:
        self.display = display
        self.scene_manager = scene_manager
        self.command_queue = command_queue
        self.args = args
        self.audio_player = audio_player
        self.running = True
        self._clock = pygame.time.Clock()
        self._screen: Optional[pygame.Surface] = None
        self._screen_size: Tuple[int, int] = (display.source_size * 2, display.source_size * 2)
        self._output_surface: Optional[pygame.Surface] = None
        self._source_surface: Optional[pygame.Surface] = None
        self._mqtt_client: Optional["mqtt.Client"] = None
        self._audio_topic = args.audio_topic

    def initialize(self) -> None:
        pygame.init()
        pygame.font.init()
        flags = 0
        if self.args.display_mode == "fullscreen":
            flags |= pygame.FULLSCREEN
            desired_size = (0, 0)
        else:
            desired_size = (self.display.source_size * 2, self.display.source_size * 2)
        self._screen = pygame.display.set_mode(desired_size, flags)
        pygame.display.set_caption(self.display.title)
        self._screen_size = self._screen.get_size()
        self._output_surface = pygame.Surface(
            (self.display.source_size * 2, self.display.source_size * 2)
        ).convert()
        self._source_surface = pygame.Surface(
            (self.display.source_size, self.display.source_size)
        ).convert()
        logging.info("Display size: %sx%s", *self._screen_size)
        self._connect_mqtt()

    def _connect_mqtt(self) -> None:
        if mqtt is None:
            logging.warning("paho-mqtt is not installed; MQTT control disabled")
            return
        if not self.args.mqtt_host:
            logging.info("MQTT host not provided; skipping MQTT setup")
            return
        client = mqtt.Client()
        client.on_connect = self._on_mqtt_connect
        client.on_message = self._on_mqtt_message
        client.on_disconnect = self._on_mqtt_disconnect
        try:
            client.connect_async(self.args.mqtt_host, self.args.mqtt_port, keepalive=60)
        except Exception as exc:  # pragma: no cover - network dependent
            logging.error("Failed to connect to MQTT broker: %s", exc)
            return
        client.loop_start()
        self._mqtt_client = client
        logging.info(
            "MQTT client configured for %s:%s on topic '%s'",
            self.args.mqtt_host,
            self.args.mqtt_port,
            self.args.mqtt_topic,
        )

    # MQTT callbacks -----------------------------------------------------
    def _on_mqtt_connect(self, client: "mqtt.Client", userdata: Any, flags: Dict[str, Any], rc: int) -> None:
        if rc == 0:
            logging.info("Connected to MQTT broker")
            client.subscribe(self.args.mqtt_topic)
            if self._audio_topic:
                client.subscribe(self._audio_topic)
        else:
            logging.error("MQTT connection failed with code %s", rc)

    def _on_mqtt_message(self, client: "mqtt.Client", userdata: Any, message: "mqtt.MQTTMessage") -> None:
        payload = message.payload.decode("utf-8", errors="ignore")
        try:
            data = json.loads(payload)
            if message.topic == self._audio_topic:
                self.audio_player.play(data if isinstance(data, dict) else {})
            elif isinstance(data, dict):
                self.command_queue.put(data)
            else:
                logging.warning("Ignoring non-dict MQTT payload: %s", data)
        except json.JSONDecodeError as exc:
            logging.warning("Invalid JSON payload received: %s (%s)", payload, exc)

    def _on_mqtt_disconnect(self, client: "mqtt.Client", userdata: Any, rc: int) -> None:
        if rc != 0:
            logging.warning("Unexpected MQTT disconnect (code %s)", rc)

    # -------------------------------------------------------------------
    def run(self) -> None:  # pragma: no cover - interactive loop
        self.initialize()
        last_time = time.perf_counter()
        while self.running:
            now = time.perf_counter()
            dt = now - last_time
            last_time = now
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.stop()
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                    if self.args.display_mode == "windowed":
                        self.stop()
            self._process_commands()
            if self._source_surface is None or self._output_surface is None:
                logging.error("Renderer surfaces not initialized")
                self.stop()
                break
            self.scene_manager.render(self._source_surface, dt)
            self._render_quadrants()
            self._clock.tick(self.display.fps)
        self.shutdown()

    def _process_commands(self) -> None:
        while True:
            try:
                command = self.command_queue.get_nowait()
            except queue.Empty:
                break
            scene_name = command.get("scene")
            if scene_name:
                self.scene_manager.set_active_scene(scene_name)
            params = command.get("params")
            if params and isinstance(params, dict):
                active_name = self.scene_manager.active_scene_name
                target_scene = scene_name or (active_name or "")
                if target_scene:
                    self.scene_manager.update_scene_params(target_scene, params)
            logging.debug("Processed command: %s", command)

    def _render_quadrants(self) -> None:
        assert self._screen is not None
        assert self._output_surface is not None
        assert self._source_surface is not None
        self._output_surface.fill(self.display.background)
        top_flipped = pygame.transform.flip(self._source_surface, False, True)
        top_right = pygame.transform.flip(top_flipped, True, False)
        bottom_right = pygame.transform.flip(self._source_surface, True, False)
        size = self.display.source_size
        self._output_surface.blit(top_flipped, (0, 0))
        self._output_surface.blit(top_right, (size, 0))
        self._output_surface.blit(self._source_surface, (0, size))
        self._output_surface.blit(bottom_right, (size, size))
        if self._screen_size != self._output_surface.get_size():
            scaled = pygame.transform.smoothscale(self._output_surface, self._screen_size)
            self._screen.blit(scaled, (0, 0))
        else:
            self._screen.blit(self._output_surface, (0, 0))
        pygame.display.flip()

    def stop(self) -> None:
        self.running = False

    def shutdown(self) -> None:
        logging.info("Shutting down renderer")
        if self._mqtt_client is not None:
            self._mqtt_client.loop_stop()
            self._mqtt_client.disconnect()
            self._mqtt_client = None
        self.scene_manager.shutdown()
        self.audio_player.stop()
        pygame.quit()


def load_scene_config(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Scene configuration not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="[%(asctime)s] %(levelname)s %(message)s",
    )
    scene_file = Path(args.scene_file)
    if not scene_file.is_absolute():
        scene_file = Path(__file__).resolve().parent / scene_file
    config = load_scene_config(scene_file)
    display = DisplayConfig.from_dict(config.get("display", {}))
    use_camera = os.getenv("USE_CAMERA", "0") == "1"
    command_queue: "queue.Queue[Dict[str, Any]]" = queue.Queue()
    scene_manager = SceneManager(config, display, use_camera, args.camera_index)
    audio_base_path = Path(args.audio_base_path)
    if not audio_base_path.is_absolute():
        audio_base_path = Path(__file__).resolve().parent / audio_base_path
    audio_player = AudioPlayer(audio_base_path, disabled=args.disable_audio)
    renderer = HoloRenderer(display, scene_manager, command_queue, args, audio_player)

    def handle_signal(signum: int, _frame: Any) -> None:
        logging.info("Received signal %s; stopping renderer", signum)
        renderer.stop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, handle_signal)

    try:
        renderer.run()
    except KeyboardInterrupt:
        renderer.stop()
    except Exception:
        logging.exception("Unhandled exception in renderer loop")
        renderer.stop()
        raise


if __name__ == "__main__":
    main()
