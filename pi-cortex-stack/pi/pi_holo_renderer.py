"""MQTT driven renderer for the Pi holographic display."""

from __future__ import annotations

import base64
import json
import logging
import mimetypes
import os
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Optional

import cv2  # type: ignore
import paho.mqtt.client as mqtt

STATE_DIR = Path(os.environ.get("PI_CORTEX_HOLO_STATE_DIR", "/var/lib/pi-cortex/holo"))
AUDIO_STATE_DIR = Path(
    os.environ.get("PI_CORTEX_AUDIO_STATE_DIR", "/var/lib/pi-cortex/audio")
)

logger = logging.getLogger("pi_holo_renderer")


def ensure_state_dir() -> None:
    global STATE_DIR, AUDIO_STATE_DIR
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        fallback = Path.home() / ".pi-cortex" / "holo"
        fallback.mkdir(parents=True, exist_ok=True)
        STATE_DIR = fallback
    try:
        AUDIO_STATE_DIR.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        fallback_audio = Path.home() / ".pi-cortex" / "audio"
        fallback_audio.mkdir(parents=True, exist_ok=True)
        AUDIO_STATE_DIR = fallback_audio
    if logger.handlers:
        return
    logger.setLevel(logging.INFO)
    logger.propagate = False
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    file_handler = logging.FileHandler(STATE_DIR / "pi-holo-renderer.log")
    file_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)
    logger.addHandler(file_handler)


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


def decode_asset(message: mqtt.MQTTMessage) -> Optional[Path]:
    try:
        payload = json.loads(message.payload.decode())
        encoded = payload["payload"]
        filename = payload.get("filename", "asset.png")
        data = base64.b64decode(encoded)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to decode asset message: %s", exc)
        return None
    target = STATE_DIR / filename
    target.write_bytes(data)
    logger.info("Wrote asset frame to %s", target)
    return target


def update_text(message: mqtt.MQTTMessage) -> str:
    text = message.payload.decode(errors="ignore")
    (STATE_DIR / "text.txt").write_text(text)
    logger.info("Updated holo text to %s", text)
    return text


def decode_audio(message: mqtt.MQTTMessage) -> Optional[Path]:
    try:
        payload = json.loads(message.payload.decode())
        encoded = payload["payload"]
        filename = Path(payload.get("filename", "clip")).name
        content_type = payload.get("content_type")
        data = base64.b64decode(encoded)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to decode audio message: %s", exc)
        return None
    if "." not in filename and content_type:
        guessed_ext = mimetypes.guess_extension(content_type) or ""
        filename = f"{filename}{guessed_ext}"
    target = AUDIO_STATE_DIR / filename
    target.write_bytes(data)
    logger.info("Wrote audio clip to %s", target)
    return target


def play_audio(audio_path: Path, player: str, autoplay: bool) -> None:
    if not autoplay:
        logger.info("Autoplay disabled; skipping playback for %s", audio_path)
        return
    resolved_player = shutil.which(player)
    if not resolved_player:
        logger.warning("Audio player %s not found; skipping playback", player)
        return
    logger.info("Playing audio clip %s with %s", audio_path, resolved_player)
    try:
        subprocess.run([resolved_player, str(audio_path)], check=False)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to play audio clip %s: %s", audio_path, exc)


def open_window() -> Optional[str]:
    if os.environ.get("PI_CORTEX_HEADLESS") == "1":
        logger.info("Running in headless mode; skipping OpenCV window")
        return None
    window_name = "Pi Holo Renderer"
    cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)
    return window_name


def display_image(window_name: str, image_path: Path, text: str) -> None:
    image = cv2.imread(str(image_path))
    if image is None:
        logger.warning("Unable to load asset image at %s", image_path)
        return
    overlay = image.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(
        overlay,
        text,
        (20, overlay.shape[0] - 40),
        font,
        1.0,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    blended = cv2.addWeighted(overlay, 0.85, image, 0.15, 0)
    cv2.imshow(window_name, blended)
    cv2.waitKey(1)


def main() -> None:
    ensure_state_dir()
    env = load_env()
    broker = env.get("PI_CORTEX_MQTT_HOST", "localhost")
    port = int(env.get("PI_CORTEX_MQTT_PORT", "1883"))
    asset_topic = env.get("PI_CORTEX_ASSET_TOPIC", "pi/assets/logo")
    holo_topic = env.get("PI_CORTEX_HOLO_TOPIC", "pi/holo/text")
    audio_topic = env.get("PI_CORTEX_AUDIO_TOPIC", "pi/audio/clip")
    autoplay = env.get("PI_CORTEX_AUDIO_AUTOPLAY", "1").lower() not in {
        "0",
        "false",
        "no",
    }
    audio_player = env.get("PI_CORTEX_AUDIO_PLAYER", "aplay")

    client = mqtt.Client()
    window_name = open_window()
    latest_image: Optional[Path] = None
    latest_text = ""

    def on_connect(_client, _userdata, _flags, rc):
        if rc == 0:
            logger.info("Connected to MQTT broker at %s:%s", broker, port)
            client.subscribe(asset_topic)
            client.subscribe(holo_topic)
            client.subscribe(audio_topic)
        else:
            logger.error("Failed to connect to MQTT broker rc=%s", rc)

    def on_message(_client, _userdata, msg: mqtt.MQTTMessage):
        nonlocal latest_image, latest_text
        if msg.topic == asset_topic:
            latest_image = decode_asset(msg)
        elif msg.topic == holo_topic:
            latest_text = update_text(msg)
        elif msg.topic == audio_topic:
            audio_path = decode_audio(msg)
            if audio_path:
                threading.Thread(
                    target=play_audio,
                    args=(audio_path, audio_player, autoplay),
                    daemon=True,
                ).start()
        if window_name and latest_image and latest_image.exists():
            display_image(window_name, latest_image, latest_text)

    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port, keepalive=60)

    def shutdown(_signum, _frame):
        logger.info("Stopping renderer")
        client.loop_stop()
        cv2.destroyAllWindows()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    client.loop_start()
    logger.info("Renderer started; waiting for messages")
    try:
        signal.pause()
    except AttributeError:
        # Windows compatibility; we do not expect to run here but handle anyway.
        while True:
            time.sleep(1)


if __name__ == "__main__":
    main()
