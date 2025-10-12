#!/usr/bin/env python3
"""Bridge ops/reflex alerts to the haptics Arduino over serial."""

from __future__ import annotations

import argparse
import json
import logging
import queue
import signal
import sys
import threading
import time
from dataclasses import dataclass
from typing import Optional

import paho.mqtt.client as mqtt
import serial

DEFAULT_ALERT_TOPIC = "ops/reflex/alert"
DEFAULT_STATUS_TOPIC = "ops/reflex/haptic_status"
ACK_PREFIX = "ACK:"


@dataclass
class AlertMessage:
    kind: str
    duration_ms: int
    intensity: int

    @classmethod
    def from_payload(cls, payload: dict) -> Optional["AlertMessage"]:
        kind = payload.get("kind")
        if not isinstance(kind, str) or not kind:
            return None

        meta = payload.get("meta") or {}
        try:
            duration = int(meta.get("dur_ms", 500))
        except (TypeError, ValueError):
            duration = 500
        try:
            intensity = int(meta.get("intensity", 200))
        except (TypeError, ValueError):
            intensity = 200

        duration = max(50, min(duration, 5000))
        intensity = max(0, min(intensity, 255))
        return cls(kind=kind, duration_ms=duration, intensity=intensity)

    def to_serial_line(self) -> str:
        return f"kind={self.kind},dur={self.duration_ms},int={self.intensity}\n"


class SerialReader(threading.Thread):
    def __init__(self, ser: serial.SerialBase, status_queue: "queue.Queue[str]") -> None:
        super().__init__(daemon=True)
        self._ser = ser
        self._status_queue = status_queue
        self._running = threading.Event()
        self._running.set()

    def run(self) -> None:
        while self._running.is_set():
            try:
                raw = self._ser.readline()
            except serial.SerialException as exc:  # pragma: no cover - hardware dependent
                logging.error("Serial read error: %s", exc)
                time.sleep(1.0)
                continue

            if not raw:
                continue

            line = raw.decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            logging.debug("serial<= %s", line)
            if line.startswith(ACK_PREFIX):
                self._status_queue.put(line[len(ACK_PREFIX) :].strip())

    def stop(self) -> None:
        self._running.clear()


class HapticsBridge:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.client = mqtt.Client()
        self.client.enable_logger(logging.getLogger("mqtt"))
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.serial = serial.Serial(
            args.serial_port, args.baud, timeout=1
        )
        self.status_queue: "queue.Queue[str]" = queue.Queue()
        self.reader = SerialReader(self.serial, self.status_queue)
        self._status_thread = threading.Thread(target=self._publish_status_loop, daemon=True)
        self._stop = threading.Event()

    def start(self) -> None:
        logging.info(
            "Connecting to MQTT broker %s:%s", self.args.mqtt_host, self.args.mqtt_port
        )
        self.reader.start()
        self._status_thread.start()
        self.client.connect(self.args.mqtt_host, self.args.mqtt_port, keepalive=30)
        self.client.loop_start()

    def wait_forever(self) -> None:
        try:
            while not self._stop.is_set():
                time.sleep(0.2)
        except KeyboardInterrupt:
            logging.info("Stopping bridge")
            self.stop()

    def stop(self) -> None:
        self._stop.set()
        self.reader.stop()
        self.reader.join(timeout=1.5)
        self.client.loop_stop()
        self.client.disconnect()
        self._status_thread.join(timeout=1.5)
        self.serial.close()

    # MQTT callbacks -----------------------------------------------------

    def _on_connect(self, client: mqtt.Client, userdata, flags, rc):  # type: ignore[override]
        if rc != 0:
            logging.error("MQTT connection failed with rc=%s", rc)
            return
        logging.info("Connected to MQTT, subscribing to %s", self.args.alert_topic)
        client.subscribe(self.args.alert_topic, qos=1)

    def _on_message(self, client: mqtt.Client, userdata, msg: mqtt.MQTTMessage):  # type: ignore[override]
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
        except json.JSONDecodeError:
            logging.warning("Ignoring non-JSON payload on %s", msg.topic)
            return

        alert = AlertMessage.from_payload(payload)
        if alert is None:
            logging.warning("Payload missing required fields: %s", payload)
            return

        line = alert.to_serial_line()
        logging.info("serial=> %s", line.strip())
        try:
            self.serial.write(line.encode("utf-8"))
            self.serial.flush()
        except serial.SerialException as exc:  # pragma: no cover - hardware dependent
            logging.error("Serial write error: %s", exc)

        status_payload = json.dumps(
            {
                "kind": alert.kind,
                "state": "sent",
                "timestamp": time.time(),
            }
        )
        client.publish(self.args.status_topic, status_payload, qos=0, retain=False)

    # Status publishing --------------------------------------------------

    def _publish_status_loop(self) -> None:
        while not self._stop.is_set():
            try:
                kind = self.status_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            payload = json.dumps(
                {"kind": kind, "state": "ack", "timestamp": time.time()}
            )
            logging.info("Publishing ack for %s", kind)
            self.client.publish(self.args.status_topic, payload, qos=0, retain=False)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mqtt-host", default="localhost", help="MQTT broker hostname (default: localhost)"
    )
    parser.add_argument(
        "--mqtt-port", type=int, default=1883, help="MQTT broker port (default: 1883)"
    )
    parser.add_argument(
        "--alert-topic", default=DEFAULT_ALERT_TOPIC, help="MQTT topic for alerts"
    )
    parser.add_argument(
        "--status-topic", default=DEFAULT_STATUS_TOPIC, help="MQTT topic for acks"
    )
    parser.add_argument(
        "--serial-port",
        default="/dev/ttyACM0",
        help="Serial device for the Arduino (default: /dev/ttyACM0)",
    )
    parser.add_argument(
        "--baud", type=int, default=115200, help="Serial baud rate (default: 115200)"
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ERROR)",
    )
    return parser.parse_args(argv)


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    configure_logging(args.log_level)

    bridge = HapticsBridge(args)

    def _signal_handler(signum, frame):
        logging.info("Received signal %s, shutting down", signum)
        bridge.stop()

    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)

    bridge.start()
    bridge.wait_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
