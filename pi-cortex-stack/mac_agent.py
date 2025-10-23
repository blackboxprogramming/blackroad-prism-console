"""Mac orchestration agent for the Pi Cortex stack.

The agent publishes assets and control commands to the MQTT fabric. It is
primarily designed to run on a Mac laptop or mini that is responsible for
coordinating the demo experience.
"""

from __future__ import annotations

import argparse
import base64
import json
import logging
import mimetypes
import os
import signal
import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

import paho.mqtt.client as mqtt
from PIL import Image

LOG_DIR = Path.home() / ".pi-cortex-agent" / "logs"
DEFAULT_ASSET_NAME = "logo.png"
DEFAULT_AUDIO_NAME = "clip.wav"


def load_env_file(path: Path) -> Dict[str, str]:
    """Load a very small .env style file into a dictionary."""

    values: Dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


@dataclass
class AgentConfig:
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    asset_dir: Path = Path("assets")
    asset_topic: str = "pi/assets/logo"
    holo_topic: str = "pi/holo/text"
    panel_topic: str = "pi/panel/text"
    heartbeat_topic: str = "pi/ops/heartbeat"
    heartbeat_interval: int = 30
    audio_topic: str = "pi/audio/clip"
    audio_asset: str = DEFAULT_AUDIO_NAME

    @classmethod
    def from_env(cls, env: Optional[Dict[str, str]] = None) -> "AgentConfig":
        env = dict(env or {})
        dotenv = load_env_file(Path(".env"))
        # Values from actual environment take precedence over .env file values.
        for key, value in dotenv.items():
            env.setdefault(key, value)
        return cls(
            mqtt_host=env.get("PI_CORTEX_MQTT_HOST", cls.mqtt_host),
            mqtt_port=int(env.get("PI_CORTEX_MQTT_PORT", cls.mqtt_port)),
            asset_dir=Path(env.get("PI_CORTEX_ASSET_DIR", str(cls.asset_dir))),
            asset_topic=env.get("PI_CORTEX_ASSET_TOPIC", cls.asset_topic),
            holo_topic=env.get("PI_CORTEX_HOLO_TOPIC", cls.holo_topic),
            panel_topic=env.get("PI_CORTEX_PANEL_TOPIC", cls.panel_topic),
            heartbeat_topic=env.get(
                "PI_CORTEX_HEARTBEAT_TOPIC", cls.heartbeat_topic
            ),
            heartbeat_interval=int(
                env.get("PI_CORTEX_HEARTBEAT_INTERVAL", cls.heartbeat_interval)
            ),
            audio_topic=env.get("PI_CORTEX_AUDIO_TOPIC", cls.audio_topic),
            audio_asset=env.get("PI_CORTEX_AUDIO_ASSET", cls.audio_asset),
        )


class PiCortexAgent:
    """Utility class that manages MQTT interactions."""

    def __init__(self, config: AgentConfig) -> None:
        self.config = config
        self._client = mqtt.Client()
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._stop_event = threading.Event()
        self._heartbeat_thread: Optional[threading.Thread] = None

        LOG_DIR.mkdir(parents=True, exist_ok=True)
        logging.basicConfig(
            filename=LOG_DIR / "agent.log",
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
        )
        logging.getLogger().addHandler(logging.StreamHandler(sys.stdout))

    # ------------------------------------------------------------------
    # MQTT lifecycle
    # ------------------------------------------------------------------
    def connect(self) -> None:
        logging.info(
            "Connecting to MQTT broker at %s:%s",
            self.config.mqtt_host,
            self.config.mqtt_port,
        )
        self._client.connect(self.config.mqtt_host, self.config.mqtt_port, keepalive=60)
        self._client.loop_start()

    def disconnect(self) -> None:
        logging.info("Disconnecting from MQTT broker")
        self._client.loop_stop()
        self._client.disconnect()

    # ------------------------------------------------------------------
    # Asset handling
    # ------------------------------------------------------------------
    def push_assets(self, asset_name: str = DEFAULT_ASSET_NAME) -> None:
        asset_path = self.config.asset_dir / asset_name
        if not asset_path.exists():
            raise FileNotFoundError(
                f"Asset {asset_path} not found. Ensure the file exists before pushing."
            )
        logging.info("Pushing asset %s", asset_path)
        payload = self._prepare_image_payload(asset_path)
        info = self._client.publish(self.config.asset_topic, payload, qos=1, retain=True)
        info.wait_for_publish()
        logging.info("Asset push complete. MQTT mid=%s", info.mid)

    def push_audio(self, audio_name: Optional[str] = None) -> None:
        clip_name = audio_name or self.config.audio_asset
        audio_path = self.config.asset_dir / clip_name
        if not audio_path.exists():
            raise FileNotFoundError(
                f"Audio clip {audio_path} not found. Ensure the file exists before pushing."
            )
        logging.info("Pushing audio clip %s", audio_path)
        payload = self._prepare_binary_payload(audio_path)
        info = self._client.publish(self.config.audio_topic, payload, qos=1, retain=True)
        info.wait_for_publish()
        logging.info("Audio push complete. MQTT mid=%s", info.mid)

    def _prepare_image_payload(self, path: Path) -> bytes:
        with Image.open(path) as image:
            image = image.convert("RGBA")
            buffer = Path(LOG_DIR / "last_asset.png")
            image.save(buffer)
            data = buffer.read_bytes()
        return self._encode_payload(
            original_name=path.name,
            data=data,
            content_type="image/png",
        )

    def _prepare_binary_payload(self, path: Path) -> bytes:
        data = path.read_bytes()
        content_type, _ = mimetypes.guess_type(str(path))
        return self._encode_payload(
            original_name=path.name,
            data=data,
            content_type=content_type,
        )

    def _encode_payload(
        self, *, original_name: str, data: bytes, content_type: Optional[str]
    ) -> bytes:
        payload: Dict[str, str] = {
            "filename": original_name,
            "payload": base64.b64encode(data).decode("ascii"),
        }
        if content_type:
            payload["content_type"] = content_type
        return json.dumps(payload).encode()

    # ------------------------------------------------------------------
    # Publishing helpers
    # ------------------------------------------------------------------
    def publish_text(self, text: str) -> None:
        logging.info("Publishing text payload: %s", text)
        for topic in (self.config.holo_topic, self.config.panel_topic):
            info = self._client.publish(topic, text, qos=1, retain=True)
            info.wait_for_publish()
            logging.debug("Published to %s with mid=%s", topic, info.mid)

    def start_heartbeat(self) -> None:
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return

        def _beat() -> None:
            logging.info(
                "Starting heartbeat loop publishing to %s", self.config.heartbeat_topic
            )
            while not self._stop_event.is_set():
                payload = json.dumps({"ts": time.time(), "source": "mac-agent"})
                self._client.publish(self.config.heartbeat_topic, payload, qos=0)
                time.sleep(self.config.heartbeat_interval)

        self._heartbeat_thread = threading.Thread(target=_beat, daemon=True)
        self._heartbeat_thread.start()

    def stop(self) -> None:
        logging.info("Stopping agent")
        self._stop_event.set()
        if self._heartbeat_thread:
            self._heartbeat_thread.join(timeout=2)
        self.disconnect()

    # ------------------------------------------------------------------
    # MQTT callbacks
    # ------------------------------------------------------------------
    def _on_connect(self, client: mqtt.Client, _userdata, _flags, rc: int) -> None:
        if rc == 0:
            logging.info("MQTT connection established")
        else:
            logging.error("MQTT connection failed with rc=%s", rc)

    def _on_disconnect(self, client: mqtt.Client, _userdata, rc: int) -> None:
        logging.warning("MQTT disconnected with rc=%s", rc)


def _handle_run(agent: PiCortexAgent) -> None:
    agent.connect()
    agent.start_heartbeat()

    def _signal_handler(_signum, _frame) -> None:
        agent.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    logging.info("Agent is running. Press Ctrl+C to exit.")
    while True:
        time.sleep(1)


def _parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pi Cortex Mac agent")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("run", help="Run the agent loop")

    push_parser = subparsers.add_parser("push-assets", help="Push shared assets")
    push_parser.add_argument(
        "--name", default=DEFAULT_ASSET_NAME, help="Asset file name inside the assets directory"
    )

    push_audio_parser = subparsers.add_parser("push-audio", help="Push an audio clip")
    push_audio_parser.add_argument(
        "--name",
        default=None,
        help=(
            "Audio file name inside the assets directory. Defaults to PI_CORTEX_AUDIO_ASSET or"
            f" {DEFAULT_AUDIO_NAME}."
        ),
    )

    publish_parser = subparsers.add_parser(
        "publish", help="Publish a one-off message to the holo/panel topics"
    )
    publish_parser.add_argument("text", help="Text to publish")

    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> None:
    args = _parse_args(argv)
    config = AgentConfig.from_env(os.environ)
    agent = PiCortexAgent(config)

    if args.command == "run":
        _handle_run(agent)
    else:
        agent.connect()
        try:
            if args.command == "push-assets":
                agent.push_assets(asset_name=args.name)
            elif args.command == "push-audio":
                agent.push_audio(audio_name=args.name)
            elif args.command == "publish":
                agent.publish_text(args.text)
        finally:
            agent.stop()


if __name__ == "__main__":
    main()
