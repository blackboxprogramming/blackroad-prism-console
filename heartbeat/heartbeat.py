#!/usr/bin/env python3
"""Publish periodic device heartbeats with system metrics to MQTT."""
from __future__ import annotations

import argparse
import json
import logging
import os
import signal
import socket
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional
from urllib.parse import urlparse

import psutil
from paho.mqtt import client as mqtt


LOGGER = logging.getLogger("heartbeat")


@dataclass
class MQTTConfig:
    host: str
    port: int
    scheme: str
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: bool = False


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        raise SystemExit(f"Invalid float for {name}: {raw!r}")


def parse_mqtt_url(url: str) -> MQTTConfig:
    if "://" not in url:
        url = f"mqtt://{url}"

    parsed = urlparse(url)
    if not parsed.hostname:
        raise SystemExit(f"MQTT URL must include a host: {url!r}")

    scheme = parsed.scheme or "mqtt"
    tls_schemes = {"mqtts", "ssl", "tls"}
    default_port = 8883 if scheme in tls_schemes else 1883

    username = parsed.username
    password = parsed.password

    return MQTTConfig(
        host=parsed.hostname,
        port=parsed.port or default_port,
        scheme=scheme,
        username=username,
        password=password,
        use_tls=scheme in tls_schemes,
    )


def build_client(config: MQTTConfig, client_id: str) -> mqtt.Client:
    client = mqtt.Client(client_id=client_id, clean_session=True)
    client.enable_logger(logging.getLogger("paho.mqtt.client"))

    if config.username:
        client.username_pw_set(config.username, config.password)

    if config.use_tls:
        ca_file = os.environ.get("MQTT_CA_FILE")
        cert_file = os.environ.get("MQTT_CERT_FILE")
        key_file = os.environ.get("MQTT_KEY_FILE")
        client.tls_set(ca_certs=ca_file, certfile=cert_file, keyfile=key_file)
        if os.environ.get("MQTT_TLS_INSECURE", "").lower() in {"1", "true", "yes"}:
            client.tls_insecure_set(True)

    keepalive = int(os.environ.get("MQTT_KEEPALIVE", "60"))
    client.reconnect_delay_set(min_delay=1, max_delay=30)

    def _on_connect(_client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int) -> None:
        if rc == 0:
            LOGGER.info("Connected to MQTT broker %s:%s", config.host, config.port)
        else:
            LOGGER.error("Failed to connect to MQTT broker (code %s)", rc)

    def _on_disconnect(_client: mqtt.Client, _userdata: Any, rc: int) -> None:
        if rc != 0:
            LOGGER.warning("Unexpected MQTT disconnection (code %s)", rc)

    client.on_connect = _on_connect
    client.on_disconnect = _on_disconnect

    try:
        client.connect(config.host, config.port, keepalive=keepalive)
    except Exception as exc:  # pragma: no cover - connectivity errors are runtime specific
        raise SystemExit(f"Unable to connect to MQTT broker at {config.host}:{config.port} ({exc})")

    return client


def collect_temperatures() -> Dict[str, Iterable[Dict[str, Optional[float]]]]:
    temps: Dict[str, Iterable[Dict[str, Optional[float]]]] = {}
    try:
        sensor_map = psutil.sensors_temperatures()
    except (AttributeError, NotImplementedError):
        return temps

    for label, entries in sensor_map.items():
        temps[label] = [
            {
                "label": entry.label or None,
                "current": entry.current,
                "high": entry.high,
                "critical": entry.critical,
            }
            for entry in entries
        ]
    return temps


def collect_metrics(hostname: str) -> Dict[str, Any]:
    virtual_mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    cpu_freq = psutil.cpu_freq()
    try:
        load_avg = os.getloadavg()
    except (OSError, AttributeError):
        load_avg = None

    metrics: Dict[str, Any] = {
        "hostname": hostname,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
        "cpu": {
            "percent": psutil.cpu_percent(interval=None),
            "count_logical": psutil.cpu_count(logical=True),
            "count_physical": psutil.cpu_count(logical=False),
            "frequency": {
                "current": cpu_freq.current if cpu_freq else None,
                "min": cpu_freq.min if cpu_freq else None,
                "max": cpu_freq.max if cpu_freq else None,
            },
            "load_average": load_avg,
        },
        "memory": {
            "total": virtual_mem.total,
            "available": virtual_mem.available,
            "used": virtual_mem.used,
            "percent": virtual_mem.percent,
            "swap_total": swap.total,
            "swap_used": swap.used,
            "swap_percent": swap.percent,
        },
        "disk": {
            "path": "/",
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent,
        },
        "network": {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
            "packets_sent": net.packets_sent,
            "packets_recv": net.packets_recv,
        },
        "process_count": len(psutil.pids()),
        "temperatures": collect_temperatures(),
    }

    return metrics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mqtt-url",
        default=os.environ.get("MQTT_URL", "mqtt://localhost:1883"),
        help="MQTT broker URL (e.g. mqtt://host:1883)",
    )
    parser.add_argument(
        "--topic-prefix",
        default=os.environ.get("MQTT_TOPIC_PREFIX", "system/heartbeat"),
        help="Topic prefix to publish under",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=_env_float("INTERVAL", 10.0),
        help="Publish interval in seconds",
    )
    parser.add_argument(
        "--hostname",
        default=os.environ.get("HEARTBEAT_HOSTNAME") or socket.gethostname(),
        help="Override the hostname included in the payload",
    )
    parser.add_argument(
        "--log-level",
        default=os.environ.get("LOG_LEVEL", "INFO"),
        help="Logging level",
    )
    return parser.parse_args()


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def main() -> None:
    args = parse_args()
    configure_logging(args.log_level)

    if args.interval <= 0:
        raise SystemExit("Interval must be greater than zero")

    mqtt_config = parse_mqtt_url(args.mqtt_url)
    client_id = f"heartbeat-{args.hostname}"
    client = build_client(mqtt_config, client_id)

    topic_prefix = args.topic_prefix.rstrip("/")
    topic = f"{topic_prefix}/{args.hostname}"
    LOGGER.info("Publishing heartbeats to %s every %ss", topic, args.interval)

    should_run = True

    def _signal_handler(signum: int, _frame: Any) -> None:
        nonlocal should_run
        LOGGER.info("Received signal %s, shutting down", signum)
        should_run = False

    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, _signal_handler)

    client.loop_start()

    try:
        psutil.cpu_percent(interval=None)  # Prime the CPU percent sampler
        while should_run:
            payload = collect_metrics(args.hostname)
            message = json.dumps(payload)
            result = client.publish(topic, payload=message, qos=0, retain=False)
            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                LOGGER.error("Failed to publish heartbeat (rc=%s)", result.rc)
            else:
                LOGGER.debug("Published heartbeat payload: %s", message)
            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
        LOGGER.info("Heartbeat publisher stopped")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
