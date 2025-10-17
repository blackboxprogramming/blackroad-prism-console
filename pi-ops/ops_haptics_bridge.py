#!/usr/bin/env python3
"""MQTT to serial bridge for the ops haptics controller."""
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

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
LOGGER = logging.getLogger("ops_haptics_bridge")


@dataclass
class Alert:
DEFAULT_ALERT_TOPIC = "ops/reflex/alert"
DEFAULT_STATUS_TOPIC = "ops/reflex/haptic_status"
ACK_PREFIX = "ACK:"


@dataclass
class AlertMessage:
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
    sys.exit(main(sys.argv[1:]))
    sys.exit(main())
