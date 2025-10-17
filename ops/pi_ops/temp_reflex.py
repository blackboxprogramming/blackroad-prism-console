#!/usr/bin/env python3
"""Reflex script for Pi-Ops to warn when devices report high temperatures."""

from __future__ import annotations

import argparse
import json
import logging
import signal
import sys
from typing import Any, Dict, Optional

import paho.mqtt.client as mqtt

DEFAULT_HEARTBEAT_TOPIC = "system/heartbeat/#"
DEFAULT_ALERT_TOPIC = "holo/cmd"
DEFAULT_THRESHOLD_C = 70.0
ALERT_PAYLOAD = {
    "mode": "text",
    "text": "⚠️ TEMP HIGH",
    "params": {"size": 48},
}


def _extract_temperature(payload: Any) -> Optional[float]:
    """Best-effort extraction of a Celsius temperature from a heartbeat payload."""
    if isinstance(payload, dict):
        for key in ("temp_c", "temperature_c", "temperature"):
            value = payload.get(key)
            if value is None:
                continue
            try:
                return float(value)
            except (TypeError, ValueError):
                continue
        # Sometimes readings are nested under a sensors field.
        sensors = payload.get("sensors")
        if isinstance(sensors, dict):
            return _extract_temperature(sensors)
        if isinstance(sensors, list):
            for item in sensors:
                temp = _extract_temperature(item)
                if temp is not None:
                    return temp
    return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Subscribe to heartbeat topics and trigger an immediate holo warning "
            "when the reported temperature exceeds a threshold."
        )
    )
    parser.add_argument("--host", default="localhost", help="MQTT broker hostname")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument(
        "--topic",
        default=DEFAULT_HEARTBEAT_TOPIC,
        help="MQTT topic filter for heartbeat messages",
    )
    parser.add_argument(
        "--alert-topic",
        default=DEFAULT_ALERT_TOPIC,
        help="MQTT topic that receives the holo warning command",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_THRESHOLD_C,
        help="Temperature threshold in Celsius that triggers the warning",
    )
    parser.add_argument(
        "--qos",
        type=int,
        choices=(0, 1, 2),
        default=1,
        help="MQTT QoS to use for subscriptions and alert publishes",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ...)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    client = mqtt.Client()

    def handle_connect(_client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int) -> None:
        if rc != 0:
            logging.error("MQTT connection failed with code %s", rc)
            return
        logging.info("Connected to MQTT broker at %s:%s", args.host, args.port)
        _client.subscribe(args.topic, qos=args.qos)
        logging.info("Subscribed to %s", args.topic)

    def handle_message(_client: mqtt.Client, _userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except json.JSONDecodeError:
            logging.debug("Ignoring non-JSON payload on %s", msg.topic)
            return

        temperature = _extract_temperature(payload)
        if temperature is None:
            logging.debug("No temperature found in payload from %s", msg.topic)
            return

        logging.debug("Heartbeat %s reports %.2f°C", msg.topic, temperature)
        if temperature >= args.threshold:
            logging.warning("High temperature %.2f°C detected (threshold %.2f°C)", temperature, args.threshold)
            result = _client.publish(
                args.alert_topic,
                json.dumps(ALERT_PAYLOAD),
                qos=args.qos,
                retain=False,
            )
            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                logging.error("Failed to publish alert: rc=%s", result.rc)
            else:
                logging.info("Published alert to %s", args.alert_topic)

    client.on_connect = handle_connect
    client.on_message = handle_message

    stop = False

    def _request_stop(signum: int, _frame: Any) -> None:
        nonlocal stop
        logging.info("Received signal %s, shutting down", signum)
        stop = True
        client.disconnect()

    signal.signal(signal.SIGINT, _request_stop)
    signal.signal(signal.SIGTERM, _request_stop)

    client.connect(args.host, args.port)

    while not stop:
        client.loop(timeout=1.0)

    logging.info("Exited cleanly")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover - defensive logging for ops usage
        logging.exception("Unhandled exception: %s", exc)
        sys.exit(1)
