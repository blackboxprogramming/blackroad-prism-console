#!/usr/bin/env python3
"""BlackRoad Pi-Holo renderer with effect support.

This service polls the device command queue exposed by the BlackRoad
backplane and renders frames on the holographic display. The renderer
understands simple view commands as well as the ``mode:"clear"`` and
``mode:"effect"`` states added by the effects patch.
"""
from __future__ import annotations

import json
import logging
import math
import os
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

try:  # Pillow is optional; the service falls back to lightweight stubs.
    from PIL import Image, ImageDraw, ImageFont  # type: ignore
except Exception:  # pragma: no cover - Pillow is not required on the Pi.
    Image = ImageDraw = ImageFont = None  # type: ignore


LOGGER = logging.getLogger("pi-holo")


@dataclass
class PulseConfig:
    """Configuration for the pulse effect."""

    speed: float = 1.0
    intensity: float = 1.0
    duration: float = 3.0

    @classmethod
    def from_payload(cls, payload: Dict[str, Any] | None) -> "PulseConfig":
        payload = payload or {}
        speed = float(payload.get("speed", 1.0))
        intensity = float(payload.get("intensity", 1.0))
        duration = float(payload.get("duration", 3.0))
        return cls(
            speed=max(0.05, speed),
            intensity=max(0.0, min(1.0, intensity)),
            duration=max(0.1, duration),
        )


class HoloDisplay:
    """Best-effort abstraction around the holographic display backend."""

    def __init__(self) -> None:
        self.width = int(os.getenv("HOLO_WIDTH", "480"))
        self.height = int(os.getenv("HOLO_HEIGHT", "800"))
        self.clear_rgb = self._parse_color(os.getenv("HOLO_CLEAR_RGB", "0,0,0"))
        self.output_path = Path(os.getenv("HOLO_FRAME_PATH", "/tmp/pi-holo-frame.png"))
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        self.view_dir = Path(os.getenv("HOLO_VIEW_DIR", "/home/pi/holo/views"))
        self.view_dir.mkdir(parents=True, exist_ok=True)
        self._font = self._load_font()
        self._last_signature: Optional[tuple[Any, ...]] = None

    @staticmethod
    def _parse_color(value: str) -> tuple[int, int, int]:
        parts = [p.strip() for p in value.split(",") if p.strip()]
        if len(parts) != 3:
            return (0, 0, 0)
        try:
            return tuple(max(0, min(255, int(float(p)))) for p in parts)  # type: ignore[return-value]
        except ValueError:
            return (0, 0, 0)

    @staticmethod
    def _load_font():
        if not ImageFont:
            return None
        try:
            return ImageFont.load_default()
        except Exception:
            return None

    def clear(self) -> None:
        self.fill(self.clear_rgb)

    def fill(self, color: tuple[int, int, int]) -> None:
        signature = ("fill", color)
        if signature == self._last_signature:
            return
        if Image:
            img = Image.new("RGB", (self.width, self.height), color)
            self._save_image(img, signature)
        else:
            self.output_path.write_text(json.dumps({"mode": "fill", "color": color}))
            self._last_signature = signature

    def render_text(self, text: str, *, signature: Optional[tuple[Any, ...]] = None) -> None:
        signature = signature or ("text", text)
        if signature == self._last_signature:
            return
        if Image:
            img = Image.new("RGB", (self.width, self.height), self.clear_rgb)
            draw = ImageDraw.Draw(img)
            font = self._font
            if not font:
                font = ImageFont.load_default() if ImageFont else None
            if font:
                try:
                    bbox = draw.textbbox((0, 0), text, font=font)
                    text_w = bbox[2] - bbox[0]
                    text_h = bbox[3] - bbox[1]
                except Exception:
                    text_w, text_h = draw.textsize(text, font=font)  # type: ignore[arg-type]
            else:
                font = None
                text_w, text_h = draw.textsize(text)  # type: ignore[arg-type]
            pos = ((self.width - text_w) / 2, (self.height - text_h) / 2)
            draw.text(pos, text, fill=(255, 255, 255), font=font)
            self._save_image(img, signature)
        else:
            self.output_path.write_text(text + "\n")
            self._last_signature = signature

    def render_view(self, name: Optional[str]) -> None:
        if not name:
            self.render_text("(no view)")
            return
        signature = ("view", name)
        if signature == self._last_signature:
            return
        asset_png = self.view_dir / f"{name}.png"
        if Image and asset_png.exists():
            try:
                img = Image.open(asset_png).convert("RGB")
                if img.size != (self.width, self.height):
                    img = img.resize((self.width, self.height))
                self._save_image(img, signature)
                return
            except Exception as exc:
                LOGGER.warning("failed to load view '%s': %s", name, exc)
        # fallback text rendering
        self.render_text(name.upper(), signature=signature)

    def _save_image(self, img: "Image.Image", signature: tuple[Any, ...]) -> None:  # type: ignore[name-defined]
        try:
            img.save(self.output_path)
            self._last_signature = signature
        except Exception as exc:
            LOGGER.error("failed to save frame: %s", exc)


class PulseEffect:
    """Simple greyscale pulse effect."""

    def __init__(self, display: HoloDisplay, config: PulseConfig) -> None:
        self.display = display
        self.config = config
        self.started_at = time.time()

    def step(self) -> bool:
        now = time.time()
        elapsed = now - self.started_at
        if elapsed >= self.config.duration:
            self.display.clear()
            return False
        phase = elapsed * self.config.speed * math.pi * 2.0
        level = (math.sin(phase) + 1.0) / 2.0
        brightness = max(0.0, min(1.0, level * self.config.intensity))
        value = int(round(brightness * 255))
        self.display.fill((value, value, value))
        return True


class HoloRenderer:
    """Main renderer daemon."""

    def __init__(self) -> None:
        self.api = os.getenv("BACKPLANE_URL", "http://127.0.0.1:4000")
        self.key = os.getenv("BR_KEY", "")
        self.device_id = os.getenv("DEVICE_ID", "pi-holo")
        self.default_view = os.getenv("HOLO_DEFAULT_VIEW", "logo")
        self.display = HoloDisplay()
        self.state: Dict[str, Any] = {
            "mode": "view",
            "view": self.default_view,
            "effect": None,
            "until": 0.0,
        }
        self._effect_runner: Optional[PulseEffect] = None
        self._lock = threading.Lock()
        self._stop = threading.Event()

    # ---------- networking helpers ----------
    def _req(self, path: str, data: Dict[str, Any] | None = None) -> Optional[Any]:
        url = f"{self.api.rstrip('/')}{path}"
        headers = {"X-BlackRoad-Key": self.key}
        if data is None:
            req = urllib.request.Request(url, headers=headers)
        else:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
            req = urllib.request.Request(url, data=body, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.length == 0:
                    return None
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            LOGGER.error("HTTP error %s while calling %s", exc.code, url)
        except Exception as exc:  # pragma: no cover - network failure path
            LOGGER.warning("network request failed: %s", exc)
        return None

    def _post(self, path: str, data: Dict[str, Any]) -> None:
        self._req(path, data)

    # ---------- state management ----------
    def apply_payload(self, payload: Dict[str, Any]) -> None:
        if not payload:
            return
        ttl = payload.get("ttl_s")
        with self._lock:
            if ttl:
                self.state["until"] = time.time() + float(ttl)
            else:
                self.state["until"] = 0.0

            mode = payload.get("mode")
            view = payload.get("view")
            effect_payload = payload.get("effect")

            if view == "clear":
                mode = "clear"

            if mode == "clear":
                self.state.update({"mode": "clear", "view": "clear", "effect": None})
                self._effect_runner = None
                return

            if mode == "effect" or effect_payload:
                cfg = PulseConfig.from_payload(effect_payload)
                self.state.update({"mode": "effect", "view": payload.get("view", "effect"), "effect": cfg})
                self._effect_runner = PulseEffect(self.display, cfg)
                return

            if view:
                self.state.update({"mode": mode or "view", "view": view, "effect": None})
                self._effect_runner = None
                return

            if mode == "view" and not view:
                self.state.update({"mode": "view", "view": self.default_view, "effect": None})
                self._effect_runner = None

    def handle_command(self, cmd: Dict[str, Any]) -> None:
        payload = cmd.get("payload") or cmd
        ctype = payload.get("type", "")
        if ctype == "holo.clear":
            self.apply_payload({"mode": "clear"})
        elif ctype == "holo.effect":
            effect = payload.get("effect") or {k: v for k, v in payload.items() if k not in ("type",)}
            self.apply_payload({"mode": "effect", "effect": effect, "view": payload.get("view")})
        elif ctype == "holo.view":
            self.apply_payload({"mode": payload.get("mode", "view"), "view": payload.get("view")})
        else:
            self.apply_payload(payload)

    # ---------- workers ----------
    def poll_commands(self) -> None:
        while not self._stop.is_set():
            try:
                cmds = self._req(f"/api/devices/{self.device_id}/commands")
                if isinstance(cmds, list):
                    for cmd in cmds:
                        self.handle_command(cmd)
            except Exception as exc:  # pragma: no cover - background loop
                LOGGER.warning("command poll failed: %s", exc)
            time.sleep(1.0)

    def telemetry_loop(self) -> None:
        while not self._stop.is_set():
            with self._lock:
                payload = {
                    "id": self.device_id,
                    "role": "holo",
                    "ts": time.strftime("%FT%T"),
                    "mode": self.state.get("mode"),
                    "view": self.state.get("view"),
                }
            try:
                self._post(f"/api/devices/{self.device_id}/telemetry", payload)
            except Exception:  # pragma: no cover - telemetry is best effort
                pass
            self._stop.wait(5.0)

    def render_tick(self) -> None:
        with self._lock:
            mode = self.state.get("mode")
            view = self.state.get("view")
            until = float(self.state.get("until", 0.0) or 0.0)
            effect = self.state.get("effect")

        now = time.time()
        if until and now > until:
            with self._lock:
                self.state.update({"mode": "view", "view": self.default_view, "effect": None, "until": 0.0})
                self._effect_runner = None
            mode = "view"
            view = self.default_view
            effect = None

        if mode == "clear" or view == "clear":
            self.display.clear()
            return

        if mode == "effect" and isinstance(effect, PulseConfig):
            runner = self._effect_runner or PulseEffect(self.display, effect)
            self._effect_runner = runner
            if not runner.step():
                with self._lock:
                    self.state.update({"mode": "clear", "view": "clear", "effect": None, "until": 0.0})
                    self._effect_runner = None
            return

        self.display.render_view(view)

    def run(self) -> None:
        logging.basicConfig(
            level=getattr(logging, os.getenv("HOLO_LOG_LEVEL", "INFO").upper(), logging.INFO),
            format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        )
        LOGGER.info("starting Pi-Holo renderer for %s", self.device_id)
        threading.Thread(target=self.poll_commands, daemon=True).start()
        threading.Thread(target=self.telemetry_loop, daemon=True).start()
        try:
            while not self._stop.is_set():
                self.render_tick()
                time.sleep(0.05)
        except KeyboardInterrupt:
            LOGGER.info("stopping renderer")
            self._stop.set()


if __name__ == "__main__":
    HoloRenderer().run()
