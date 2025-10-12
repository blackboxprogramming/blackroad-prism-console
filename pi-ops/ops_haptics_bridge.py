#!/usr/bin/env python3
"""MQTT to serial bridge for the ops haptics controller."""

from __future__ import annotations

import argparse
import json
import logging
import signal
import sys
import threading
import time
from dataclasses import dataclass
from typing import Optional

import paho.mqtt.client as mqtt
import serial

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
LOGGER = logging.getLogger("ops_haptics_bridge")


@dataclass
class Alert:
    kind: str
    duration_ms: int
    intensity: int

    @classmethod
    def from_payload(cls, payload: str) -> "Alert":
        try:
            data = json.loads(payload)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON payload: {exc}") from exc

        if not isinstance(data, dict):
            raise ValueError("Payload must be a JSON object")

        kind = data.get("kind")
        if not isinstance(kind, str) or not kind:
            raise ValueError("Alert kind must be a non-empty string")

        meta = data.get("meta") or {}
        if not isinstance(meta, dict):
            raise ValueError("meta must be a JSON object when provided")

        duration = meta.get("dur_ms", 500)
        intensity = meta.get("intensity", 255)

        try:
            duration_ms = max(0, int(duration))
        except (TypeError, ValueError) as exc:
            raise ValueError("dur_ms must be an integer") from exc

        try:
            intensity_value = int(intensity)
        except (TypeError, ValueError) as exc:
            raise ValueError("intensity must be an integer") from exc

        intensity_value = max(0, min(255, intensity_value))

        return cls(kind=kind, duration_ms=duration_ms, intensity=intensity_value)

    def serialize(self) -> str:
        return f"ALERT {self.kind} {self.duration_ms} {self.intensity}\n"


class SerialBridge:
    def __init__(self, port: str, baudrate: int, timeout: float) -> None:
        self.serial = serial.Serial(port, baudrate=baudrate, timeout=timeout)
        self.lock = threading.Lock()

    def send_alert(self, alert: Alert) -> str:
        line = alert.serialize().encode("ascii")
        with self.lock:
            LOGGER.debug("Sending line to serial: %s", line)
            self.serial.write(line)
            self.serial.flush()
            return self.read_ack(timeout=2.0)

    def read_ack(self, timeout: float) -> str:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            chunk = self.serial.readline()
            if chunk:
                try:
                    text = chunk.decode("utf-8", errors="replace").strip()
                except UnicodeDecodeError:
                    continue
                if text:
                    LOGGER.debug("Received line from serial: %s", text)
                    return text
            time.sleep(0.05)
        return ""

    def close(self) -> None:
        try:
            self.serial.close()
        except serial.SerialException:
            pass


class BridgeApplication:
    def __init__(
        self,
        mqtt_host: str,
        mqtt_port: int,
        serial_port: str,
        serial_baud: int,
        mqtt_alert_topic: str,
        mqtt_status_topic: str,
    ) -> None:
        self.mqtt_host = mqtt_host
        self.mqtt_port = mqtt_port
        self.serial_port = serial_port
        self.serial_baud = serial_baud
        self.mqtt_alert_topic = mqtt_alert_topic
        self.mqtt_status_topic = mqtt_status_topic

        self.bridge: Optional[SerialBridge] = None
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        self.running = True

    def start(self) -> None:
        LOGGER.info("Opening serial port %s @ %s", self.serial_port, self.serial_baud)
        self.bridge = SerialBridge(self.serial_port, self.serial_baud, timeout=0.1)

        LOGGER.info("Connecting to MQTT broker %s:%s", self.mqtt_host, self.mqtt_port)
        self.client.connect(self.mqtt_host, self.mqtt_port, keepalive=30)
        self.client.loop_start()

        while self.running:
            time.sleep(0.2)

    def stop(self) -> None:
        LOGGER.info("Stopping bridge")
        self.running = False
        self.client.loop_stop()
        self.client.disconnect()
        if self.bridge:
            self.bridge.close()

    # MQTT callbacks -----------------------------------------------------
    def _on_connect(self, client: mqtt.Client, _userdata, _flags, rc: int) -> None:
        if rc != 0:
            LOGGER.error("MQTT connection failed with code %s", rc)
            return
        LOGGER.info("Connected to MQTT, subscribing to %s", self.mqtt_alert_topic)
        client.subscribe(self.mqtt_alert_topic)

    def _on_disconnect(self, _client: mqtt.Client, _userdata, rc: int) -> None:
        if rc != 0:
            LOGGER.warning("Unexpected MQTT disconnection (code %s)", rc)

    def _on_message(self, _client: mqtt.Client, _userdata, msg: mqtt.MQTTMessage) -> None:
        payload_text = msg.payload.decode("utf-8", errors="replace")
        LOGGER.info("Received alert payload: %s", payload_text)
        try:
            alert = Alert.from_payload(payload_text)
        except ValueError as exc:
            LOGGER.error("Failed to parse alert payload: %s", exc)
            self._publish_status({
                "status": "error",
                "error": str(exc),
                "raw": payload_text,
            })
            return

        if self.bridge is None:
            LOGGER.error("Serial bridge is not ready")
            self._publish_status({
                "status": "error",
                "error": "serial_not_ready",
                "kind": alert.kind,
            })
            return

        ack = self.bridge.send_alert(alert)
        status = {
            "status": "ok" if ack.startswith("ACK") else "timeout",
            "kind": alert.kind,
            "ack": ack,
            "duration_ms": alert.duration_ms,
            "intensity": alert.intensity,
        }
        LOGGER.info("Publishing status: %s", status)
        self._publish_status(status)

    def _publish_status(self, payload_dict: dict) -> None:
        try:
            payload = json.dumps(payload_dict)
        except (TypeError, ValueError) as exc:
            LOGGER.error("Could not encode status payload: %s", exc)
            return
        self.client.publish(self.mqtt_status_topic, payload)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bridge ops alerts to haptics controller")
    parser.add_argument("--mqtt-host", default="localhost")
    parser.add_argument("--mqtt-port", type=int, default=1883)
    parser.add_argument("--mqtt-alert-topic", default="ops/reflex/alert")
    parser.add_argument("--mqtt-status-topic", default="ops/reflex/haptic_status")
    parser.add_argument("--serial-port", default="/dev/ttyACM0")
    parser.add_argument("--serial-baud", type=int, default=115200)
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def configure_logging(level: str) -> None:
    logging.basicConfig(level=getattr(logging, level.upper(), logging.INFO), format=LOG_FORMAT)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    configure_logging(args.log_level)

    app = BridgeApplication(
        mqtt_host=args.mqtt_host,
        mqtt_port=args.mqtt_port,
        serial_port=args.serial_port,
        serial_baud=args.serial_baud,
        mqtt_alert_topic=args.mqtt_alert_topic,
        mqtt_status_topic=args.mqtt_status_topic,
    )

    def handle_signal(signum, _frame):
        LOGGER.info("Received signal %s, shutting down", signum)
        app.stop()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    try:
        app.start()
    except serial.SerialException as exc:
        LOGGER.error("Serial error: %s", exc)
        return 1
    finally:
        app.stop()

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
