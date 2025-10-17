#!/usr/bin/env python3
"""Pi-Sim panel renderer.

This lightweight simulator mirrors the command surface of the Pi-Holo
renderer and writes a preview frame to disk. It now honours
``view:"clear"`` commands so the simulated panel matches the hardware.
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

try:  # Pillow is optional on macOS simulators.
    from PIL import Image, ImageDraw, ImageFont  # type: ignore
except Exception:  # pragma: no cover - used only when Pillow missing.
    Image = ImageDraw = ImageFont = None  # type: ignore

LOGGER = logging.getLogger("pi-sim")


class PanelSurface:
    """Best-effort preview surface for the simulator."""

    def __init__(self) -> None:
        self.width = int(os.getenv("SIM_PANEL_WIDTH", "480"))
        self.height = int(os.getenv("SIM_PANEL_HEIGHT", "800"))
        self.output_path = Path(os.getenv("SIM_PANEL_PATH", "/tmp/pi-sim-panel.png"))
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        self._font = self._load_font()
        self._last_signature: Optional[tuple[Any, ...]] = None

    @staticmethod
    def _load_font():
        if not ImageFont:
            return None
        try:
            return ImageFont.load_default()
        except Exception:
            return None

    def clear(self) -> None:
        self.draw_fill((0, 0, 0))

    def draw_fill(self, color: tuple[int, int, int]) -> None:
        signature = ("fill", color)
        if signature == self._last_signature:
            return
        if Image:
            img = Image.new("RGB", (self.width, self.height), color)
            self._save(img, signature)
        else:
            self.output_path.write_text(json.dumps({"fill": color}))
            self._last_signature = signature

    def draw_text(self, label: str, *, signature: Optional[tuple[Any, ...]] = None) -> None:
        signature = signature or ("text", label)
        if signature == self._last_signature:
            return
        if Image:
            img = Image.new("RGB", (self.width, self.height), (0, 0, 0))
            draw = ImageDraw.Draw(img)
            font = self._font or (ImageFont.load_default() if ImageFont else None)
            if font:
                try:
                    bbox = draw.textbbox((0, 0), label, font=font)
                    tw = bbox[2] - bbox[0]
                    th = bbox[3] - bbox[1]
                except Exception:
                    tw, th = draw.textsize(label, font=font)  # type: ignore[arg-type]
            else:
                tw, th = draw.textsize(label)  # type: ignore[arg-type]
            pos = ((self.width - tw) / 2, (self.height - th) / 2)
            draw.text(pos, label, fill=(255, 255, 255), font=font)
            self._save(img, signature)
        else:
            self.output_path.write_text(label + "\n")
            self._last_signature = signature

    def draw_view(self, view: Optional[str]) -> None:
        if not view:
            self.draw_text("(no view)")
            return
        if view == "clear":
            self.clear()
            return
        signature = ("view", view)
        if signature == self._last_signature:
            return
        self.draw_text(view.upper(), signature=signature)

    def _save(self, img: "Image.Image", signature: tuple[Any, ...]) -> None:  # type: ignore[name-defined]
        try:
            img.save(self.output_path)
            self._last_signature = signature
        except Exception as exc:
            LOGGER.error("failed to save simulated panel frame: %s", exc)


class PanelSimulator:
    """Command loop for the simulated panel."""

    def __init__(self) -> None:
        self.api = os.getenv("BACKPLANE_URL", "http://127.0.0.1:4000")
        self.key = os.getenv("BR_KEY", "")
        self.device_id = os.getenv("DEVICE_ID", "pi-sim")
        self.surface = PanelSurface()
        self.state: Dict[str, Any] = {"mode": "view", "view": "boot", "effect": None}
        self._lock = threading.Lock()
        self._stop = threading.Event()

    def _req(self, path: str) -> Optional[Any]:
        url = f"{self.api.rstrip('/')}{path}"
        headers = {"X-BlackRoad-Key": self.key}
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.length == 0:
                    return None
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            LOGGER.error("HTTP error %s while calling %s", exc.code, url)
        except Exception as exc:  # pragma: no cover - background path
            LOGGER.warning("command poll failed: %s", exc)
        return None

    def apply_payload(self, payload: Dict[str, Any]) -> None:
        if not payload:
            return
        with self._lock:
            view = payload.get("view")
            mode = payload.get("mode")
            if view == "clear" or mode == "clear":
                self.state.update({"mode": "clear", "view": "clear"})
            elif mode == "effect" and payload.get("effect"):
                # Sim does not render effects, but we surface the state.
                self.state.update({"mode": "effect", "view": payload.get("view", "effect"), "effect": payload.get("effect")})
            elif view:
                self.state.update({"mode": mode or "view", "view": view, "effect": None})

    def handle_command(self, cmd: Dict[str, Any]) -> None:
        payload = cmd.get("payload") or cmd
        ctype = payload.get("type", "")
        if ctype == "holo.clear":
            self.apply_payload({"mode": "clear"})
        elif ctype == "holo.effect":
            eff = payload.get("effect") or {k: v for k, v in payload.items() if k != "type"}
            self.apply_payload({"mode": "effect", "effect": eff, "view": payload.get("view")})
        elif ctype == "holo.view":
            self.apply_payload({"mode": payload.get("mode", "view"), "view": payload.get("view")})
        else:
            self.apply_payload(payload)

    def poll_commands(self) -> None:
        while not self._stop.is_set():
            cmds = self._req(f"/api/devices/{self.device_id}/commands")
            if isinstance(cmds, list):
                for cmd in cmds:
                    self.handle_command(cmd)
            self._stop.wait(1.0)

    def render_loop(self) -> None:
        while not self._stop.is_set():
            with self._lock:
                mode = self.state.get("mode")
                view = self.state.get("view")
            if mode == "clear" or view == "clear":
                self.surface.clear()
            elif mode == "effect":
                # Keep the view label visible even if we don't render the effect.
                self.surface.draw_text("EFFECT: " + str(self.state.get("effect", {}).get("type", "pulse")))
            else:
                self.surface.draw_view(view)
            self._stop.wait(0.1)

    def run(self) -> None:
        logging.basicConfig(
            level=getattr(logging, os.getenv("SIM_LOG_LEVEL", "INFO").upper(), logging.INFO),
            format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        )
        LOGGER.info("starting Pi-Sim panel for %s", self.device_id)
        threading.Thread(target=self.poll_commands, daemon=True).start()
        try:
            self.render_loop()
        except KeyboardInterrupt:
            LOGGER.info("stopping Pi-Sim panel")
            self._stop.set()


if __name__ == "__main__":
    PanelSimulator().run()
