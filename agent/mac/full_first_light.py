"""First-light full system heartbeat verification script.

This script performs a coordinated MQTT-level check across the operator
infrastructure. It publishes a heartbeat for the Mac, triggers supporting
status topics, listens for peer heartbeats, and prints a concise summary of
node responsiveness.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from threading import Event, Lock
from typing import Callable, Dict, Iterable, Optional

import paho.mqtt.client as mqtt


@dataclass
class NodeExpectation:
    """Represents an expected node heartbeat."""

    label: str
    topic_suffix: str


class FirstLightMonitor:
    """Encapsulates MQTT coordination for the first-light check."""

    def __init__(
        self,
        client: mqtt.Client,
        heartbeat_prefix: str,
        expected_nodes: Iterable[NodeExpectation],
    ) -> None:
        self._client = client
        self._heartbeat_prefix = heartbeat_prefix.rstrip("/")
        self._expected: Dict[str, NodeExpectation] = {
            node.topic_suffix: node for node in expected_nodes
        }
        self._latencies: Dict[str, Optional[float]] = {
            key: None for key in self._expected
        }
        self._lock = Lock()
        self._completed = Event()
        self._listen_started_at: float = 0.0

    def expectations(self) -> Dict[str, NodeExpectation]:
        """Return a copy of the node expectations."""

        with self._lock:
            return dict(self._expected)

    # ------------------------------------------------------------------
    # MQTT callbacks
    # ------------------------------------------------------------------
    def handle_message(self, client: mqtt.Client, userdata, message: mqtt.MQTTMessage) -> None:  # type: ignore[override]
        """Record heartbeats that match the expected nodes."""

        topic = message.topic or ""
        prefix = f"{self._heartbeat_prefix}/"
        if not topic.startswith(prefix):
            return

        node_id = topic[len(prefix) :]
        if node_id not in self._expected:
            return

        with self._lock:
            if self._latencies[node_id] is None:
                self._latencies[node_id] = time.time() - self._listen_started_at
            if all(value is not None for value in self._latencies.values()):
                self._completed.set()

    # ------------------------------------------------------------------
    # Listening lifecycle
    # ------------------------------------------------------------------
    def listen(
        self,
        duration: float,
        on_listen_start: Optional[Callable[[], None]] = None,
    ) -> Dict[str, Optional[float]]:
        """Subscribe and listen for heartbeats for up to ``duration`` seconds."""

        self._listen_started_at = time.time()
        topic = f"{self._heartbeat_prefix}/#"
        self._client.subscribe(topic)
        if on_listen_start is not None:
            try:
                on_listen_start()
            except Exception:
                self._client.unsubscribe(topic)
                raise
        deadline = self._listen_started_at + duration

        while True:
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            if self._completed.wait(timeout=min(0.25, remaining)):
                break

        self._client.unsubscribe(topic)
        return dict(self._latencies)


def build_parser() -> argparse.ArgumentParser:
    """Return the CLI argument parser."""

    parser = argparse.ArgumentParser(
        description="Run the full first-light MQTT system heartbeat check.",
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("MQTT_HOST", "localhost"),
        help="MQTT broker host (default: %(default)s)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("MQTT_PORT", "1883")),
        help="MQTT broker port (default: %(default)s)",
    )
    parser.add_argument(
        "--username",
        default=os.environ.get("MQTT_USERNAME"),
        help="MQTT username when authentication is enabled.",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("MQTT_PASSWORD"),
        help="MQTT password when authentication is enabled.",
    )
    parser.add_argument(
        "--client-id",
        default=os.environ.get("MQTT_CLIENT_ID", "mac-first-light"),
        help="MQTT client identifier (default: %(default)s)",
    )
    parser.add_argument(
        "--keepalive",
        type=int,
        default=60,
        help="MQTT keepalive interval in seconds (default: %(default)s)",
    )
    parser.add_argument(
        "--heartbeat-prefix",
        default=os.environ.get("HEARTBEAT_PREFIX", "system/heartbeat"),
        help="Base topic for heartbeats (default: %(default)s)",
    )
    parser.add_argument(
        "--mac-node-id",
        default=os.environ.get("MAC_NODE_ID", "mac-agent"),
        help="Topic suffix used for the Mac heartbeat publish.",
    )
    parser.add_argument(
        "--listen-seconds",
        type=float,
        default=10.0,
        help="Seconds to listen for peer heartbeats (default: %(default)s)",
    )
    parser.add_argument(
        "--hologram-topic",
        default=os.environ.get("HOLOGRAM_TOPIC", "system/hologram/text"),
        help="Topic used for the hologram text flash (default: %(default)s)",
    )
    parser.add_argument(
        "--panel-topic",
        default=os.environ.get("PANEL_TOPIC", "system/panel/status"),
        help="Topic used for the simulator panel status (default: %(default)s)",
    )
    parser.add_argument(
        "--log-topic",
        default=os.environ.get("LOG_TOPIC", "agent/output"),
        help="Topic used for logging confirmation (default: %(default)s)",
    )
    return parser


def configure_client(args: argparse.Namespace) -> mqtt.Client:
    """Instantiate and configure the MQTT client."""

    client = mqtt.Client(client_id=args.client_id, clean_session=True)
    if args.username:
        client.username_pw_set(args.username, args.password or None)
    return client


def wait_for_connection(client: mqtt.Client, host: str, port: int, keepalive: int) -> None:
    """Connect to the broker and block until acknowledged."""

    connected = Event()
    failure: Dict[str, Optional[int]] = {"rc": None}

    def _on_connect(_client: mqtt.Client, _userdata, _flags, rc):  # type: ignore[override]
        failure["rc"] = rc
        if rc == 0:
            connected.set()

    client.on_connect = _on_connect
    client.loop_start()
    try:
        client.connect(host, port, keepalive)
    except Exception:
        client.loop_stop()
        raise

    if not connected.wait(timeout=10):
        client.loop_stop()
        raise TimeoutError(
            "Timed out waiting for MQTT connection acknowledgement."
        )

    client.on_connect = None  # type: ignore[assignment]


def publish_messages(args: argparse.Namespace, client: mqtt.Client) -> None:
    """Publish the heartbeat, hologram, panel, and log messages."""

    timestamp = time.time()
    heartbeat_payload = json.dumps(
        {
            "node": args.mac_node_id,
            "status": "online",
            "source": "full_first_light",
            "timestamp": timestamp,
        }
    )
    client.publish(
        f"{args.heartbeat_prefix.rstrip('/')}/{args.mac_node_id}",
        payload=heartbeat_payload,
        qos=1,
        retain=False,
    )

    hologram_payload = json.dumps(
        {
            "message": "System Online",
            "level": "info",
            "source": "full_first_light",
            "timestamp": timestamp,
        }
    )
    client.publish(args.hologram_topic, payload=hologram_payload, qos=1)

    panel_payload = json.dumps(
        {
            "status": "Ops, Holo, Sim Ready",
            "source": "full_first_light",
            "timestamp": timestamp,
        }
    )
    client.publish(args.panel_topic, payload=panel_payload, qos=1)

    log_payload = json.dumps(
        {
            "message": "First-light check dispatched messages",
            "node": args.mac_node_id,
            "source": "full_first_light",
            "timestamp": timestamp,
        }
    )
    client.publish(args.log_topic, payload=log_payload, qos=0)


def print_summary(latencies: Dict[str, Optional[float]], expectations: Dict[str, NodeExpectation]) -> None:
    """Render the final summary to stdout."""

    overall_latencies = []
    for node_id, expectation in expectations.items():
        latency = latencies.get(node_id)
        if latency is None:
            print(f"❌ {expectation.label} heartbeat missing")
        else:
            overall_latencies.append(latency)
            print(f"✅ {expectation.label} heartbeat received")

    if overall_latencies:
        average = sum(overall_latencies) / len(overall_latencies)
        print(f"ALL NODES RESPONDING (latency avg {average:.2f}s)")
    else:
        print("No expected heartbeat messages were received.")


def main(argv: Optional[Iterable[str]] = None) -> int:
    """Entry point for CLI execution."""

    parser = build_parser()
    args = parser.parse_args(argv)

    expectations = [
        NodeExpectation(args.mac_node_id, args.mac_node_id),
        NodeExpectation("pi-holo", "pi-holo"),
        NodeExpectation("pi-sim", "pi-sim"),
        NodeExpectation("pi-ops", "pi-ops"),
    ]

    client = configure_client(args)
    monitor = FirstLightMonitor(client, args.heartbeat_prefix, expectations)
    client.on_message = monitor.handle_message

    try:
        wait_for_connection(client, args.host, args.port, args.keepalive)
    except TimeoutError as exc:
        print(f"❌ MQTT connection timeout: {exc}")
        return 2
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"❌ Failed to connect to MQTT broker: {exc}")
        return 1

    try:
        latencies = monitor.listen(
            args.listen_seconds,
            on_listen_start=lambda: publish_messages(args, client),
        )
    finally:
        client.loop_stop()
        client.disconnect()

    print_summary(latencies, monitor.expectations())
    missing = [value for value in latencies.values() if value is None]
    return 0 if not missing else 3


if __name__ == "__main__":
    sys.exit(main())
