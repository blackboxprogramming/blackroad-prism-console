#!/usr/bin/env python3
"""Agent-to-Holo MQTT bridge.

This utility subscribes to inference results on ``agent/output`` and
converts the highest-confidence label into a command for the Pi-Holo
renderer.  Behaviour is driven by ``rules.json`` so ops engineers can
tweak colour palettes or thresholds without restarting the process.
"""
from __future__ import annotations

import json
import logging
import os
import signal
import sys
import threading
import time
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any, Dict, Iterable, Optional, Tuple

import paho.mqtt.client as mqtt

ColorTuple = Tuple[int, int, int]


def parse_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def clamp_color(value: Iterable[int]) -> ColorTuple:
    parts = list(value)
    if len(parts) != 3:
        raise ValueError("Color must have exactly 3 components")
    return tuple(max(0, min(255, int(component))) for component in parts)  # type: ignore[return-value]


def parse_color(value: Any, fallback: ColorTuple) -> ColorTuple:
    if value is None:
        return fallback
    if isinstance(value, str):
        value = value.strip()
        if value.startswith("#") and len(value) in {4, 7}:
            hex_value = value[1:]
            if len(hex_value) == 3:
                hex_value = "".join(ch * 2 for ch in hex_value)
            try:
                return clamp_color(int(hex_value[i : i + 2], 16) for i in range(0, 6, 2))
            except ValueError:
                return fallback
    try:
        return clamp_color(value)
    except Exception:
        return fallback


@dataclass
class Rule:
    """Render rule applied to a label."""

    text_template: str
    min_conf: float
    scene: str
    text_color: ColorTuple
    background: ColorTuple
    font_size: Optional[int]
    extra_params: Dict[str, Any]

    def render(self, label: str, confidence: float) -> Dict[str, Any]:
        payload = {
            "scene": self.scene,
            "params": dict(self.extra_params),
        }
        confidence_pct = round(confidence * 100)
        substitutions = {
            "label": label,
            "label_upper": label.upper(),
            "confidence": confidence,
            "confidence_pct": confidence_pct,
        }
        try:
            text = self.text_template.format(**substitutions)
        except Exception:
            text = self.text_template
        params = payload["params"]
        params.setdefault("text", text)
        params.setdefault("text_color", self.text_color)
        params.setdefault("background", self.background)
        if self.font_size is not None:
            params.setdefault("font_size", self.font_size)
        return payload


DEFAULT_RULE = Rule(
    text_template="{label_upper} ({confidence_pct}%)",
    min_conf=0.5,
    scene="text",
    text_color=(255, 255, 255),
    background=(0, 0, 0),
    font_size=None,
    extra_params={},
)


class RuleSet:
    """Hot-reloadable rule set backed by ``rules.json``."""

    def __init__(self, path: Path, reload_interval: float = 2.0) -> None:
        self._path = path
        self._reload_interval = reload_interval
        self._lock = threading.Lock()
        self._last_load: float = 0.0
        self._defaults = DEFAULT_RULE
        self._label_rules: Dict[str, Rule] = {}

    def maybe_reload(self) -> None:
        now = time.monotonic()
        if now - self._last_load < self._reload_interval:
            return
        with self._lock:
            if now - self._last_load < self._reload_interval:
                return
            self._load()

    def get_rule(self, label: str) -> Rule:
        with self._lock:
            return self._label_rules.get(label, self._defaults)

    # ------------------------------------------------------------------
    def _load(self) -> None:
        try:
            raw = self._path.read_text(encoding="utf-8")
        except FileNotFoundError:
            logging.warning("rules file %s not found; using defaults", self._path)
            self._last_load = time.monotonic()
            return
        except OSError as exc:
            logging.error("Failed to read rules file %s: %s", self._path, exc)
            self._last_load = time.monotonic()
            return
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            logging.error("Invalid JSON in %s: %s", self._path, exc)
            self._last_load = time.monotonic()
            return
        defaults = data.get("defaults", {}) if isinstance(data, dict) else {}
        self._defaults = self._build_rule(DEFAULT_RULE, defaults, label="__default__")
        labels = data.get("labels", {}) if isinstance(data, dict) else {}
        new_rules: Dict[str, Rule] = {}
        if isinstance(labels, dict):
            for label, config in labels.items():
                if not isinstance(config, dict):
                    continue
                new_rules[str(label)] = self._build_rule(self._defaults, config, label=str(label))
        self._label_rules = new_rules
        self._last_load = time.monotonic()
        logging.info("Loaded %d label rules", len(self._label_rules))

    def _build_rule(self, base: Rule, override: Dict[str, Any], *, label: str) -> Rule:
        rule = replace(base)
        if "text_template" in override:
            rule.text_template = str(override["text_template"])
        elif "text" in override:
            rule.text_template = str(override["text"])
        if "min_conf" in override:
            try:
                rule.min_conf = float(override["min_conf"])
            except (TypeError, ValueError):
                logging.warning("Invalid min_conf for label %s", label)
        if "scene" in override:
            rule.scene = str(override["scene"])
        if "text_color" in override:
            rule.text_color = parse_color(override["text_color"], rule.text_color)
        elif "color" in override:
            rule.text_color = parse_color(override["color"], rule.text_color)
        if "bg_color" in override:
            rule.background = parse_color(override["bg_color"], rule.background)
        elif "background" in override:
            rule.background = parse_color(override["background"], rule.background)
        if "font_size" in override:
            try:
                rule.font_size = int(override["font_size"])
            except (TypeError, ValueError):
                logging.warning("Invalid font_size for label %s", label)
        params = dict(rule.extra_params)
        if "params" in override and isinstance(override["params"], dict):
            params.update(override["params"])
        rule.extra_params = params
        return rule


@dataclass
class LabelResult:
    label: str
    confidence: float


class AgentBridge:
    """MQTT bridge translating agent results for Pi-Holo."""

    def __init__(
        self,
        *,
        rules: RuleSet,
        mqtt_host: str,
        mqtt_port: int,
        input_topic: str,
        output_topic: str,
        client_id: str,
        username: Optional[str],
        password: Optional[str],
        keepalive: int,
        dry_run: bool,
    ) -> None:
        self._rules = rules
        self._input_topic = input_topic
        self._output_topic = output_topic
        self._dry_run = dry_run
        self._client = mqtt.Client(client_id=client_id, clean_session=True)
        if username:
            self._client.username_pw_set(username, password=password)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect
        self._client.connect_async(mqtt_host, mqtt_port, keepalive)
        self._stop_event = threading.Event()

    def start(self) -> None:
        logging.info("Starting MQTT loop")
        self._client.loop_start()

    def stop(self) -> None:
        logging.info("Stopping MQTT loop")
        self._client.loop_stop()
        self._client.disconnect()

    # MQTT callbacks ---------------------------------------------------
    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int) -> None:
        if rc != mqtt.MQTT_ERR_SUCCESS:
            logging.error("MQTT connect failed with rc=%s", rc)
            return
        logging.info("Connected to MQTT; subscribing to %s", self._input_topic)
        client.subscribe(self._input_topic, qos=1)

    def _on_disconnect(self, _client: mqtt.Client, _userdata: Any, rc: int) -> None:
        if rc != mqtt.MQTT_ERR_SUCCESS:
            logging.warning("Unexpected MQTT disconnect rc=%s", rc)

    def _on_message(self, _client: mqtt.Client, _userdata: Any, message: mqtt.MQTTMessage) -> None:
        self._rules.maybe_reload()
        try:
            payload = message.payload.decode("utf-8")
        except UnicodeDecodeError:
            logging.warning("Received non-UTF8 payload on %s", message.topic)
            return
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            logging.warning("Invalid JSON payload on %s", message.topic)
            return
        result = extract_top_label(data)
        if result is None:
            logging.debug("No labels found in payload: %s", payload)
            return
        rule = self._rules.get_rule(result.label)
        if result.confidence < rule.min_conf:
            logging.info(
                "Skipping label %s (confidence %.2f < %.2f)",
                result.label,
                result.confidence,
                rule.min_conf,
            )
            return
        command = rule.render(result.label, result.confidence)
        output = json.dumps(command, ensure_ascii=False)
        if self._dry_run:
            logging.info("[DRY_RUN] Would publish to %s: %s", self._output_topic, output)
            return
        info = self._client.publish(self._output_topic, output, qos=1)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            logging.error("Failed to publish to %s: rc=%s", self._output_topic, info.rc)
        else:
            logging.info(
                "Published label %s (%.2f) to %s",
                result.label,
                result.confidence,
                self._output_topic,
            )


def extract_top_label(data: Any) -> Optional[LabelResult]:
    if not isinstance(data, dict):
        return None
    if data.get("channel") and data["channel"] not in {"result", "results"}:
        return None
    labels = _extract_labels(data)
    if not labels:
        return None
    labels.sort(key=lambda item: item.confidence, reverse=True)
    return labels[0]


def _extract_labels(data: Dict[str, Any]) -> list[LabelResult]:
    entries: Iterable[Any] = ()
    meta = data.get("meta")
    if isinstance(meta, dict) and isinstance(meta.get("labels"), list):
        entries = meta["labels"]
    elif isinstance(data.get("labels"), list):
        entries = data["labels"]
    results: list[LabelResult] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        label = entry.get("label") or entry.get("name")
        confidence = entry.get("confidence") or entry.get("score") or entry.get("probability")
        if label is None or confidence is None:
            continue
        try:
            confidence_value = float(confidence)
        except (TypeError, ValueError):
            continue
        if confidence_value > 1.0:
            confidence_value /= 100.0
        results.append(LabelResult(label=str(label), confidence=confidence_value))
    return results


def configure_logging() -> None:
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )


def main() -> int:
    configure_logging()
    mqtt_host = os.getenv("MQTT_HOST", "pi-ops.local")
    mqtt_port = int(os.getenv("MQTT_PORT", "1883"))
    client_id = os.getenv("MQTT_CLIENT_ID", "pi-ops-bridge")
    username = os.getenv("MQTT_USERNAME")
    password = os.getenv("MQTT_PASSWORD")
    keepalive = int(os.getenv("MQTT_KEEPALIVE", "60"))
    input_topic = os.getenv("INPUT_TOPIC", "agent/output")
    output_topic = os.getenv("OUTPUT_TOPIC", "holo/cmd")
    dry_run = parse_bool(os.getenv("DRY_RUN"))
    rules_path = Path(os.getenv("RULES_PATH", "rules.json"))
    reload_interval = float(os.getenv("RULES_RELOAD_INTERVAL", "2.0"))

    rules = RuleSet(rules_path, reload_interval=reload_interval)
    rules.maybe_reload()

    bridge = AgentBridge(
        rules=rules,
        mqtt_host=mqtt_host,
        mqtt_port=mqtt_port,
        input_topic=input_topic,
        output_topic=output_topic,
        client_id=client_id,
        username=username,
        password=password,
        keepalive=keepalive,
        dry_run=dry_run,
    )

    stop_event = threading.Event()

    def handle_signal(signum: int, _frame: Optional[Any]) -> None:
        logging.info("Received signal %s; shutting down", signum)
        stop_event.set()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    bridge.start()
    try:
        while not stop_event.is_set():
            time.sleep(0.2)
    finally:
        bridge.stop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
