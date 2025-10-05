"""MQTT publishing helpers for the macOS control server."""
from __future__ import annotations

import json
import os
import ssl
from typing import Any, Dict, Optional

from paho.mqtt import publish as mqtt_publish


def _tls_config() -> Optional[Dict[str, Any]]:
    flag = os.environ.get("MQTT_TLS", "").lower()
    if flag not in {"1", "true", "yes"}:
        return None
    ca_file = os.environ.get("MQTT_CA_FILE")
    tls: Dict[str, Any] = {"cert_reqs": ssl.CERT_REQUIRED}
    if ca_file:
        tls["ca_certs"] = ca_file
    return tls


def publish_payload(topic: str, payload: Dict[str, Any]) -> None:
    """Publish a payload to the configured MQTT broker."""
    host = os.environ.get("MQTT_HOST", "localhost")
    port = int(os.environ.get("MQTT_PORT", "1883"))
    auth = None
    username = os.environ.get("MQTT_USERNAME")
    if username:
        auth = {"username": username, "password": os.environ.get("MQTT_PASSWORD")}
    mqtt_publish.single(
        topic,
        json.dumps(payload, ensure_ascii=False),
        hostname=host,
        port=port,
        auth=auth,
        keepalive=int(os.environ.get("MQTT_KEEPALIVE", "60")),
        tls=_tls_config(),
    )
