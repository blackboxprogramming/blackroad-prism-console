"""Simulator panel that mirrors MQTT content via a FastAPI dashboard."""

from __future__ import annotations

import base64
import json
import logging
import mimetypes
import os
import threading
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
import paho.mqtt.client as mqtt
import uvicorn

STATE_DIR = Path(os.environ.get("PI_CORTEX_PANEL_STATE_DIR", "/var/lib/pi-cortex/panel"))


def ensure_state_dir() -> Path:
    global STATE_DIR
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        fallback = Path.home() / ".pi-cortex" / "panel"
        fallback.mkdir(parents=True, exist_ok=True)
        STATE_DIR = fallback
    return STATE_DIR
logger = logging.getLogger("pi_sim_panel")


class PanelState:
    def __init__(self) -> None:
        self.text: str = ""
        self.asset: Optional[Path] = None
        self.audio: Optional[Path] = None
        self.audio_content_type: Optional[str] = None
        self.updated_at: float = time.time()
        self.lock = threading.Lock()

    def to_dict(self) -> dict[str, Optional[str]]:
        with self.lock:
            return {
                "text": self.text,
                "asset": str(self.asset) if self.asset else None,
                "audio": str(self.audio) if self.audio else None,
                "audio_content_type": self.audio_content_type,
                "updated_at": self.updated_at,
            }

    def update_text(self, text: str) -> None:
        with self.lock:
            self.text = text
            self.updated_at = time.time()

    def update_asset(self, payload: bytes, filename: str) -> None:
        with self.lock:
            target_dir = ensure_state_dir()
            safe_name = Path(filename).name
            target = target_dir / safe_name
            target.write_bytes(payload)
            self.asset = target
            self.updated_at = time.time()

    def update_audio(
        self, payload: bytes, filename: str, content_type: Optional[str]
    ) -> None:
        with self.lock:
            target_dir = ensure_state_dir()
            safe_name = Path(filename).name
            target = target_dir / safe_name
            target.write_bytes(payload)
            guessed_type = content_type or mimetypes.guess_type(str(target))[0]
            self.audio = target
            self.audio_content_type = guessed_type
            self.updated_at = time.time()


state = PanelState()
app = FastAPI(title="Pi Cortex Simulator Panel")


def configure_logging() -> None:
    if logger.handlers:
        return
    logger.setLevel(logging.INFO)
    logger.propagate = False
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    logger.addHandler(console)


@app.get("/", response_class=HTMLResponse)
def dashboard() -> str:
    data = state.to_dict()
    asset_markup = ""
    if data["asset"] and Path(str(data["asset"])).exists():
        asset_path = Path(str(data["asset"]))
        b64 = base64.b64encode(asset_path.read_bytes()).decode("ascii")
        asset_markup = f'<img src="data:image/png;base64,{b64}" alt="Asset" style="max-width:100%;height:auto;" />'
    audio_markup = ""
    if data["audio"] and Path(str(data["audio"])).exists():
        audio_path = Path(str(data["audio"]))
        content_type = data.get("audio_content_type") or mimetypes.guess_type(
            str(audio_path)
        )[0] or "audio/wav"
        audio_b64 = base64.b64encode(audio_path.read_bytes()).decode("ascii")
        audio_markup = (
            "<audio controls style=\"width:100%;margin-top:20px;\">"
            f"<source src=\"data:{content_type};base64,{audio_b64}\" type=\"{content_type}\">"
            "Your browser does not support the audio element."
            "</audio>"
        )
    return f"""
    <html>
        <head>
            <title>Pi Cortex Panel</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #111; color: #f5f5f5; }}
                .container {{ max-width: 640px; margin: auto; background: #1c1c1e; padding: 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
                h1 {{ margin-top: 0; }}
                .timestamp {{ opacity: 0.7; font-size: 0.9rem; }}
                img {{ margin-top: 20px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Simulator Panel</h1>
                <p class="timestamp">Last update: {time.ctime(data['updated_at'])}</p>
                <p style="font-size: 2rem;">{data['text']}</p>
                {asset_markup}
                {audio_markup}
            </div>
        </body>
    </html>
    """


@app.get("/healthz", response_class=JSONResponse)
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "updated_at": time.ctime(state.to_dict()["updated_at"]) }


@app.get("/state", response_class=JSONResponse)
def state_json() -> dict[str, Optional[str]]:
    snapshot = state.to_dict()
    return {
        "text": snapshot["text"],
        "asset": snapshot["asset"],
        "audio": snapshot["audio"],
        "audio_content_type": snapshot["audio_content_type"],
        "updated_at": time.ctime(snapshot["updated_at"]),
    }


def load_env() -> dict[str, str]:
    env_path = Path(".env")
    values: dict[str, str] = {}
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    values.update(os.environ)
    return values


def start_mqtt_thread(env: dict[str, str]) -> None:
    broker = env.get("PI_CORTEX_MQTT_HOST", "localhost")
    port = int(env.get("PI_CORTEX_MQTT_PORT", "1883"))
    asset_topic = env.get("PI_CORTEX_ASSET_TOPIC", "pi/assets/logo")
    panel_topic = env.get("PI_CORTEX_PANEL_TOPIC", "pi/panel/text")
    audio_topic = env.get("PI_CORTEX_AUDIO_TOPIC", "pi/audio/clip")

    client = mqtt.Client()

    def on_connect(_client, _userdata, _flags, rc):
        if rc == 0:
            logger.info("Panel connected to MQTT %s:%s", broker, port)
            client.subscribe(asset_topic)
            client.subscribe(panel_topic)
            client.subscribe(audio_topic)
        else:
            logger.error("Panel failed to connect to MQTT rc=%s", rc)

    def on_message(_client, _userdata, msg: mqtt.MQTTMessage):
        if msg.topic == asset_topic:
            try:
                payload = json.loads(msg.payload.decode())
                data = base64.b64decode(payload["payload"])
                filename = payload.get("filename", "asset.png")
                state.update_asset(data, filename)
                logger.info("Panel stored asset %s", filename)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Failed to process asset payload: %s", exc)
        elif msg.topic == panel_topic:
            state.update_text(msg.payload.decode())
            logger.info("Panel text updated to %s", state.to_dict()["text"])
        elif msg.topic == audio_topic:
            try:
                payload = json.loads(msg.payload.decode())
                data = base64.b64decode(payload["payload"])
                filename = payload.get("filename", "clip.wav")
                content_type = payload.get("content_type")
                state.update_audio(data, filename, content_type)
                logger.info("Panel stored audio %s", filename)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Failed to process audio payload: %s", exc)

    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port, keepalive=60)
    client.loop_start()


def main() -> None:
    configure_logging()
    env = load_env()
    start_mqtt_thread(env)
    host = env.get("PI_CORTEX_PANEL_HOST", "0.0.0.0")
    port = int(env.get("PI_CORTEX_PANEL_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
