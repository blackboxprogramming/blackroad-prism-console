"""Visual smoke tests for the holo and simulator outputs."""

from __future__ import annotations

import argparse
import base64
import json
import logging
import os
import pathlib
import threading
import time
from typing import Iterable

try:
    import paho.mqtt.client as mqtt
except ImportError as exc:  # pragma: no cover - executed during runtime
    raise SystemExit(
        "paho-mqtt is required for the Firstlight add-on. "
        "Install it with 'pip install paho-mqtt'."
    ) from exc


HOLO_TOPIC = "holo/display"
HOLO_IMAGE_TOPIC = "holo/image"
SIM_PANEL_TOPIC = "sim/panel"
SIM_CHART_TOPIC = "sim/chart"
DEFAULT_CYCLE_DELAY = 1.5
DEFAULT_TEXT = "Prism Console Test"


def connect_client(host: str, port: int, timeout: float = 5.0) -> mqtt.Client:
    client = mqtt.Client()
    connect_event = threading.Event()

    def on_connect(_: mqtt.Client, __, ___, rc: int) -> None:
        if rc == 0:
            connect_event.set()
        else:
            logging.error("MQTT connection failed with code %s", rc)

    client.on_connect = on_connect
    client.connect(host, port)
    client.loop_start()
    if not connect_event.wait(timeout):
        client.loop_stop()
        raise TimeoutError(f"Timed out connecting to MQTT broker at {host}:{port}")
    return client


def publish_text_patterns(client: mqtt.Client, message: str, sizes: Iterable[str], delay: float) -> None:
    for size in sizes:
        payload = {
            "mode": "text",
            "title": f"TEXT {size.upper()}",
            "message": message,
            "text_size": size,
            "ttl": max(delay * 1.2, 1.0),
        }
        client.publish(HOLO_TOPIC, json.dumps(payload), qos=1, retain=False)
        time.sleep(delay)


def maybe_publish_logo(client: mqtt.Client, path: pathlib.Path, delay: float) -> bool:
    if not path.exists():
        logging.info("Logo asset %s not found; skipping image push", path)
        return False

    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    payload = {
        "mode": "image",
        "title": "Logo",
        "data_uri": f"data:image/png;base64,{encoded}",
        "ttl": max(delay * 2.0, 2.0),
    }
    client.publish(HOLO_IMAGE_TOPIC, json.dumps(payload), qos=1, retain=False)
    time.sleep(delay)
    return True


def publish_sim_panel(client: mqtt.Client, delay: float) -> None:
    panel = {
        "panel": {
            "title": "Test Patterns",
            "status": "running",
            "description": "Visual sanity sweep",
            "window_s": delay * 4,
        }
    }
    client.publish(SIM_PANEL_TOPIC, json.dumps(panel), qos=1, retain=False)

    chart = {
        "chart": {
            "title": "Signal",
            "series": [
                {
                    "label": "demo",
                    "values": [0, 0.2, 0.8, 1.0, 0.4, 0.1],
                }
            ],
        }
    }
    client.publish(SIM_CHART_TOPIC, json.dumps(chart), qos=0, retain=False)
    time.sleep(delay)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Holo and simulator test patterns")
    parser.add_argument(
        "--host",
        default=os.environ.get("MQTT_HOST", "localhost"),
        help="MQTT broker hostname",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("MQTT_PORT", "1883")),
        help="MQTT broker port",
    )
    parser.add_argument(
        "--message",
        default=DEFAULT_TEXT,
        help="Text to render in the holo test sweep",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=float(os.environ.get("CYCLE_DELAY", DEFAULT_CYCLE_DELAY)),
        help="Delay between pattern updates",
    )
    parser.add_argument(
        "--sizes",
        nargs="+",
        default=["small", "medium", "large"],
        help="Text size sequence to cycle through",
    )
    parser.add_argument(
        "--logo",
        default=os.environ.get("HOLO_LOGO", "/srv/assets/logo.png"),
        help="Path to an optional logo file",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO)

    logging.info("Connecting to MQTT broker at %s:%s", args.host, args.port)
    client = connect_client(args.host, args.port)

    try:
        publish_sim_panel(client, args.delay)
        publish_text_patterns(client, args.message, args.sizes, args.delay)
        maybe_publish_logo(client, pathlib.Path(args.logo), args.delay)
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
