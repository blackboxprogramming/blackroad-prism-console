#!/usr/bin/env python3
"""Publish Raspberry Pi heartbeat telemetry over MQTT."""
from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional

import psutil
from paho.mqtt import client as mqtt


def read_cpu_temperature() -> Optional[float]:
    """Attempt to read the CPU temperature in Celsius."""
    temps = psutil.sensors_temperatures(fahrenheit=False)
    for key in ("cpu-thermal", "soc", "coretemp", "cpu_thermal"):
        readings = temps.get(key)
        if readings:
            return float(readings[0].current)
    thermal_zone = "/sys/class/thermal/thermal_zone0/temp"
    try:
        with open(thermal_zone, "r", encoding="utf-8") as handle:
            raw = handle.read().strip()
        return int(raw) / 1000.0
    except (FileNotFoundError, ValueError):
        return None


def collect_metrics() -> Dict[str, Any]:
    """Collect uptime, load, temperature, and memory usage data."""
    uptime_seconds = int(time.time() - psutil.boot_time())
    load1, load5, load15 = os.getloadavg()
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "hostname": socket.gethostname(),
        "uptime_seconds": uptime_seconds,
        "load": {
            "1m": round(load1, 2),
            "5m": round(load5, 2),
            "15m": round(load15, 2),
        },
        "memory": {
            "total_mb": round(memory.total / 1024 / 1024, 2),
            "used_mb": round(memory.used / 1024 / 1024, 2),
            "percent": memory.percent,
        },
        "disk": {
            "total_gb": round(disk.total / 1024 / 1024 / 1024, 2),
            "used_gb": round(disk.used / 1024 / 1024 / 1024, 2),
            "percent": disk.percent,
        },
        "cpu_temp_c": read_cpu_temperature(),
    }


def build_payload(node: str) -> Dict[str, Any]:
    payload = collect_metrics()
    payload["node"] = node
    return payload


def create_client(args: argparse.Namespace) -> mqtt.Client:
    client = mqtt.Client()
    if args.username:
        client.username_pw_set(args.username, args.password or None)
    return client


def publish(client: mqtt.Client, topic: str, payload: Dict[str, Any]) -> None:
    result = client.publish(topic, json.dumps(payload, ensure_ascii=False))
    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        raise RuntimeError(f"Failed to publish heartbeat: {mqtt.error_string(result.rc)}")


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node", default=os.environ.get("NODE_NAME", "pi"), help="Node name appended to the heartbeat topic")
    parser.add_argument("--mqtt-host", default=os.environ.get("MQTT_HOST", "pi-ops.local"))
    parser.add_argument("--mqtt-port", type=int, default=int(os.environ.get("MQTT_PORT", "1883")))
    parser.add_argument("--topic-base", default=os.environ.get("MQTT_TOPIC_BASE", "system/heartbeat"))
    parser.add_argument("--interval", type=int, default=int(os.environ.get("HEARTBEAT_INTERVAL", "30")), help="Publish interval in seconds")
    parser.add_argument("--username", default=os.environ.get("MQTT_USERNAME"))
    parser.add_argument("--password", default=os.environ.get("MQTT_PASSWORD"))
    return parser.parse_args(argv)


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_args(argv)
    topic = f"{args.topic_base.rstrip('/')}/{args.node}"
    client = create_client(args)
    client.connect(args.mqtt_host, args.mqtt_port, keepalive=max(60, args.interval + 30))
    client.loop_start()
    try:
        while True:
            payload = build_payload(args.node)
            publish(client, topic, payload)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        return 0
    finally:
        client.loop_stop()
        client.disconnect()
    return 0


if __name__ == "__main__":
    sys.exit(main())
