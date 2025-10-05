"""Firstlight bootstrap routines for macOS consoles.

This module contains a small utility that publishes introductory
telemetry to the holo and simulator topics and then listens for
heartbeat events.  It is intended to be the first smoke test after
installing a fresh stack.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import queue
import threading
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

try:
    import paho.mqtt.client as mqtt
except ImportError as exc:  # pragma: no cover - executed during runtime
    raise SystemExit(
        "paho-mqtt is required for the Firstlight add-on. "
        "Install it with 'pip install paho-mqtt'."
    ) from exc


DEFAULT_HEARTBEAT_WINDOW = 10.0
EXPECTED_NODES = ("mac", "pi-ops", "pi-holo", "pi-sim")
HOLO_TOPIC = "holo/display"
SIM_PANEL_TOPIC = "sim/panel"
SIM_EVENT_TOPIC = "sim/events"
HEARTBEAT_TOPIC = "system/heartbeat/#"


@dataclass
class HeartbeatSample:
    """A single heartbeat observation from a remote node."""

    latency_ms: Optional[float] = None
    topic: Optional[str] = None
    raw_payload: Optional[str] = None


@dataclass
class HeartbeatLedger:
    """Keeps track of which nodes have checked in and their latencies."""

    samples: Dict[str, List[HeartbeatSample]] = field(default_factory=dict)

    def record(self, node: str, sample: HeartbeatSample) -> None:
        self.samples.setdefault(node, []).append(sample)

    def observed_nodes(self) -> List[str]:
        return sorted(self.samples)

    def average_latency(self, node: str) -> Optional[float]:
        latencies = [s.latency_ms for s in self.samples.get(node, []) if s.latency_ms is not None]
        if not latencies:
            return None
        return sum(latencies) / len(latencies)

    def format_summary(self) -> str:
        lines = ["Heartbeat summary:"]
        for node in EXPECTED_NODES:
            if node in self.samples:
                avg_latency = self.average_latency(node)
                latency_text = f"avg latency {avg_latency:.1f}ms" if avg_latency is not None else "latency n/a"
                lines.append(f"  ✓ {node:<7} — {latency_text}")
            else:
                lines.append(f"  ✗ {node:<7} — no heartbeat observed")
        missing = [node for node in EXPECTED_NODES if node not in self.samples]
        if missing:
            lines.append("")
            lines.append("Missing nodes: " + ", ".join(missing))
        else:
            lines.append("")
            lines.append("All expected nodes checked in. ✨")
        return "\n".join(lines)


def _payload_to_sample(topic: str, payload: bytes) -> HeartbeatSample:
    text = payload.decode("utf-8", errors="replace")
    latency = None

    try:
        body = json.loads(text)
    except json.JSONDecodeError:
        body = None

    if isinstance(body, dict):
        candidate = body.get("latency_ms") or body.get("latency")
        if isinstance(candidate, (int, float)):
            latency = float(candidate)
        elif isinstance(candidate, str):
            try:
                latency = float(candidate)
            except ValueError:
                latency = None
        if latency is None:
            sent_ts = body.get("sent_at") or body.get("sent_ts")
            if isinstance(sent_ts, (int, float)):
                latency = max((time.time() - float(sent_ts)) * 1000.0, 0.0)
    return HeartbeatSample(latency_ms=latency, topic=topic, raw_payload=text)


def publish_boot_messages(client: mqtt.Client, window_seconds: float) -> None:
    """Send greeting messages to the holo and simulator."""

    greeting = {
        "mode": "text",
        "title": "FIRSTLIGHT",
        "message": "SYSTEM ONLINE",
        "ttl": max(window_seconds, 5.0),
    }
    client.publish(HOLO_TOPIC, json.dumps(greeting), qos=1, retain=False)

    panel = {
        "panel": {
            "title": "Firstlight",
            "status": "online",
            "description": "Stack bootstrap smoke-check",
            "window_s": window_seconds,
        }
    }
    client.publish(SIM_PANEL_TOPIC, json.dumps(panel), qos=1, retain=False)

    event = {
        "event": "firstlight",
        "severity": "info",
        "message": "mac console announced system online",
        "timestamp": time.time(),
    }
    client.publish(SIM_EVENT_TOPIC, json.dumps(event), qos=0, retain=False)


def collect_heartbeats(client: mqtt.Client, window_seconds: float) -> HeartbeatLedger:
    """Subscribe to heartbeat traffic and collect samples for the window."""

    ledger = HeartbeatLedger()
    messages: "queue.Queue[tuple[str, bytes]]" = queue.Queue()

    original_handler = client.on_message

    def on_message(_: mqtt.Client, __, msg: mqtt.MQTTMessage) -> None:
        messages.put((msg.topic, msg.payload))

    client.on_message = on_message
    client.subscribe(HEARTBEAT_TOPIC)
    deadline = time.time() + window_seconds

    try:
        while time.time() < deadline:
            try:
                topic, payload = messages.get(timeout=0.25)
            except queue.Empty:
                continue
            node = topic.split("/")[-1]
            ledger.record(node, _payload_to_sample(topic, payload))
    finally:
        client.on_message = original_handler
        try:
            client.unsubscribe(HEARTBEAT_TOPIC)
        except Exception:  # pragma: no cover - best effort cleanup
            pass

    return ledger


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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Firstlight bootstrap script")
    parser.add_argument(
        "--window",
        "-w",
        type=float,
        default=float(os.environ.get("WINDOW_S", DEFAULT_HEARTBEAT_WINDOW)),
        help="Listening window for heartbeats in seconds (default: 10)",
    )
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
        publish_boot_messages(client, args.window)
        logging.info("Listening for heartbeat topics for %.1fs", args.window)
        ledger = collect_heartbeats(client, args.window)
    finally:
        client.loop_stop()
        client.disconnect()

    print(ledger.format_summary())


if __name__ == "__main__":
    main()
