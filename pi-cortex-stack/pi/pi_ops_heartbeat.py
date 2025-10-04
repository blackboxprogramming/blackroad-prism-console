"""Heartbeat publisher for the Pi Cortex stack."""

from __future__ import annotations

import json
import logging
import os
import signal
import time
from pathlib import Path

import paho.mqtt.client as mqtt

LOG_PATH = Path("/var/log/pi-cortex/pi-ops-heartbeat.log")


def configure_logging() -> None:
    global LOG_PATH
    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        fallback = Path.home() / ".pi-cortex" / "logs" / "pi-ops-heartbeat.log"
        fallback.parent.mkdir(parents=True, exist_ok=True)
        LOG_PATH = fallback
    logging.basicConfig(
        filename=LOG_PATH,
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )


configure_logging()
logger = logging.getLogger(__name__)


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


def main() -> None:
    env = load_env()
    broker = env.get("PI_CORTEX_MQTT_HOST", "localhost")
    port = int(env.get("PI_CORTEX_MQTT_PORT", "1883"))
    topic = env.get("PI_CORTEX_HEARTBEAT_TOPIC", "pi/ops/heartbeat")
    interval = int(env.get("PI_CORTEX_HEARTBEAT_INTERVAL", "30"))

    client = mqtt.Client()
    client.connect(broker, port, keepalive=60)
    client.loop_start()

    stop = False

    def _shutdown(_signum, _frame):
        nonlocal stop
        stop = True
        logger.info("Stopping heartbeat loop")

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    logger.info("Starting heartbeat loop to %s", topic)
    while not stop:
        payload = json.dumps({"ts": time.time(), "source": "pi-ops"})
        client.publish(topic, payload, qos=0)
        time.sleep(interval)

    client.loop_stop()
    client.disconnect()


if __name__ == "__main__":
    main()
