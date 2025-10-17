#!/usr/bin/env python3
"""Pi-Ops heartbeat reflex agent.

This script watches MQTT heartbeats (``system/heartbeat/<node>``), tracks node
state, and emits summary and alert topics that can drive downstream displays or
monitoring pipelines.  Thresholds are configurable through environment
variables or via the ``ops/reflex/cmd`` topic at runtime.
"""

from __future__ import annotations

import collections
import json
import os
import time
from typing import Any, Dict, Optional

import paho.mqtt.client as mqtt
from paho.mqtt.client import MQTTMessage

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

# Tunables
TEMP_WARN_C = float(os.getenv("TEMP_WARN_C", "70"))   # start warning
TEMP_CLEAR_C = float(os.getenv("TEMP_CLEAR_C", "65"))  # stop warning (hysteresis)
COOLDOWN_S = int(os.getenv("COOLDOWN_S", "15"))        # min seconds between alerts per node
GLOBAL_SPAM_GUARD_S = int(os.getenv("GLOBAL_SPAM_GUARD_S", "5"))

STATE_TOPIC = "ops/reflex/state"   # publishes current state summary
ALERT_TOPIC = "ops/reflex/alert"   # publishes alert events (JSON)
CMD_TOPIC = "ops/reflex/cmd"       # accepts JSON commands to tweak thresholds live

last_alert_by_node = collections.defaultdict(lambda: 0.0)
last_global_alert = 0.0
hot_nodes = set()
pending_high_alerts: Dict[str, float] = {}
latest: Dict[str, Dict[str, Any]] = {}


def now() -> float:
    """Return the current time as a UNIX timestamp."""

    return time.time()


def publish(mq: mqtt.Client, topic: str, payload: Any) -> None:
    """Publish a JSON payload to the given topic."""

    mq.publish(topic, json.dumps(payload), qos=1)


def alert(
    mq: mqtt.Client, kind: str, msg: str, meta: Optional[Dict[str, Any]] = None
) -> bool:
    """Send an alert event and update the spam guards.

    Returns ``True`` when an alert was emitted and ``False`` when suppressed
    by the global spam guard.
    """

    global last_global_alert

    t = now()
    if t - last_global_alert < GLOBAL_SPAM_GUARD_S:
        return False

    last_global_alert = t
    payload = {"ts": t, "kind": kind, "msg": msg, "meta": meta or {}}
    publish(mq, ALERT_TOPIC, payload)

    # Drive displays
    publish(
        mq,
        "holo/cmd",
        {"mode": "text", "text": msg, "duration_ms": 4000, "params": {"size": 48}},
    )
    publish(mq, "sim/output", {"view": "panel", "text": msg, "ttl_s": 10})

    return True


def summarize_and_publish(mq: mqtt.Client) -> None:
    """Publish a current state snapshot."""

    ok = [n for n in latest if n not in hot_nodes]
    hot = sorted(list(hot_nodes))
    payload = {
        "ts": now(),
        "nodes_seen": sorted(list(latest.keys())),
        "hot_nodes": hot,
        "ok_nodes": sorted(ok),
        "thresholds": {"TEMP_WARN_C": TEMP_WARN_C, "TEMP_CLEAR_C": TEMP_CLEAR_C},
    }
    publish(mq, STATE_TOPIC, payload)


def handle_cmd(payload: Dict[str, Any]) -> None:
    """Handle live configuration updates."""

    global TEMP_WARN_C, TEMP_CLEAR_C

    # payload like {"set":{"TEMP_WARN_C":72}} or {"ping":true}
    if "set" in payload and isinstance(payload["set"], dict):
        if "TEMP_WARN_C" in payload["set"]:
            TEMP_WARN_C = float(payload["set"]["TEMP_WARN_C"])
        if "TEMP_CLEAR_C" in payload["set"]:
            TEMP_CLEAR_C = float(payload["set"]["TEMP_CLEAR_C"])


def on_message(mq: mqtt.Client, _userdata: Any, msg: MQTTMessage) -> None:
    """Process incoming MQTT messages."""

    topic = msg.topic
    if topic.startswith("system/heartbeat/"):
        node = topic.split("/", 2)[-1]
        try:
            hb = json.loads(msg.payload.decode("utf-8"))
        except Exception:
            return

        latest[node] = hb
        temp = hb.get("temp_c")
        t = now()

        if temp is not None:
            # Enter hot
            if temp >= TEMP_WARN_C:
                if node not in hot_nodes:
                    # per-node cooldown
                    if t - last_alert_by_node[node] >= COOLDOWN_S:
                        hot_nodes.add(node)
                        emitted = alert(
                            mq,
                            "temp_high",
                            f"⚠️ {node}: {temp:.1f}°C ≥ {TEMP_WARN_C:.1f}°C",
                            {"node": node, "temp_c": temp},
                        )
                        if emitted:
                            last_alert_by_node[node] = t
                            pending_high_alerts.pop(node, None)
                        else:
                            pending_high_alerts[node] = t
                elif node in pending_high_alerts:
                    last_attempt = pending_high_alerts[node]
                    if t - last_attempt >= GLOBAL_SPAM_GUARD_S:
                        emitted = alert(
                            mq,
                            "temp_high",
                            f"⚠️ {node}: {temp:.1f}°C ≥ {TEMP_WARN_C:.1f}°C",
                            {"node": node, "temp_c": temp},
                        )
                        if emitted:
                            last_alert_by_node[node] = t
                            pending_high_alerts.pop(node, None)
                        else:
                            pending_high_alerts[node] = t
            # Exit hot
            elif temp <= TEMP_CLEAR_C and node in hot_nodes:
                hot_nodes.discard(node)
                pending_high_alerts.pop(node, None)
                alert(
                    mq,
                    "temp_ok",
                    f"✅ {node}: back to {temp:.1f}°C ≤ {TEMP_CLEAR_C:.1f}°C",
                    {"node": node, "temp_c": temp},
                )

        summarize_and_publish(mq)

    elif topic == CMD_TOPIC:
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            handle_cmd(payload)
        except Exception:
            pass


def main() -> None:
    mq = mqtt.Client(client_id="ops-reflex")
    mq.on_message = on_message
    mq.connect(MQTT_HOST, MQTT_PORT, 60)
    mq.subscribe("system/heartbeat/#")
    mq.subscribe(CMD_TOPIC)

    # announce ourselves
    publish(
        mq,
        STATE_TOPIC,
        {
            "ts": now(),
            "status": "started",
            "thresholds": {"TEMP_WARN_C": TEMP_WARN_C, "TEMP_CLEAR_C": TEMP_CLEAR_C},
        },
    )

    mq.loop_forever()


if __name__ == "__main__":
    main()
