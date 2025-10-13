#!/usr/bin/env python3
"""Run HTTP uptime checks described in observability/uptime.yml.

The configuration format is a YAML document with a top-level ``checks`` list.
Each item supports the following keys:

``name`` (required):
    A short label for the check. Used in logs and Slack alerts.
``url`` (required):
    The HTTP or HTTPS endpoint to probe.
``method`` (optional):
    Defaults to ``GET``.
``expected_status`` (optional):
    Defaults to ``200``. Can be a single integer or a list of acceptable codes.
``timeout`` (optional):
    Request timeout in seconds. Defaults to 10.
``retries`` (optional):
    Number of additional attempts when a request fails. Defaults to 0.
``contains`` (optional):
    If provided, the response body must include this substring.
``headers`` (optional):
    Mapping of HTTP headers to include in the request.
``body`` (optional):
    String payload for ``POST``/``PUT`` requests.

The script uploads a JSON report to ``artifacts/uptime-report.json`` and exits
with a non-zero status if any check fails. When the ``SLACK_WEBHOOK_URL``
environment variable is set the script will also send a compact Slack alert for
failed checks.
"""

from __future__ import annotations

import dataclasses
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Iterable, List, Sequence

import requests
import yaml

CONFIG_PATH = Path("observability/uptime.yml")
REPORT_PATH = Path("artifacts/uptime-report.json")


@dataclasses.dataclass
class CheckResult:
    name: str
    url: str
    success: bool
    status: int | None
    latency_ms: float | None
    error: str | None = None

    def to_dict(self) -> Dict[str, object]:
        return {
            "name": self.name,
            "url": self.url,
            "success": self.success,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "error": self.error,
        }


class UptimeCheckError(Exception):
    pass


def load_config() -> Sequence[dict]:
    if not CONFIG_PATH.exists():
        raise UptimeCheckError(
            f"Configuration file {CONFIG_PATH} was not found."
        )
    data = yaml.safe_load(CONFIG_PATH.read_text()) or {}
    checks = data.get("checks")
    if not checks:
        raise UptimeCheckError("No checks defined in configuration file.")
    if not isinstance(checks, list):
        raise UptimeCheckError("`checks` must be a list.")
    return checks


def normalize_status(value) -> List[int]:
    if value is None:
        return [200]
    if isinstance(value, int):
        return [value]
    if isinstance(value, Iterable):
        try:
            return [int(v) for v in value]
        except (TypeError, ValueError) as exc:
            raise UptimeCheckError("Invalid status codes in configuration.") from exc
    raise UptimeCheckError("expected_status must be an int or list of ints")


def run_check(item: dict) -> CheckResult:
    name = item.get("name") or item.get("url")
    if not name:
        raise UptimeCheckError("Each check requires a `name` or `url`.")
    url = item.get("url")
    if not url:
        raise UptimeCheckError(f"Check '{name}' is missing the `url` field.")

    method = (item.get("method") or "GET").upper()
    timeout = float(item.get("timeout") or 10)
    retries = int(item.get("retries") or 0)
    expected_status = normalize_status(item.get("expected_status"))
    headers = item.get("headers") or {}
    body = item.get("body")

    session = requests.Session()

    attempts = retries + 1
    last_error: str | None = None
    last_status: int | None = None
    latency_ms: float | None = None

    for attempt in range(1, attempts + 1):
        start = time.monotonic()
        try:
            response = session.request(
                method,
                url,
                headers=headers,
                data=body,
                timeout=timeout,
            )
            latency_ms = (time.monotonic() - start) * 1000
            last_status = response.status_code
            if response.status_code not in expected_status:
                last_error = (
                    f"Unexpected status {response.status_code}; "
                    f"expected {expected_status}"
                )
            elif item.get("contains") and item["contains"] not in response.text:
                last_error = "Expected substring not found in response body"
            else:
                return CheckResult(
                    name=name,
                    url=url,
                    success=True,
                    status=response.status_code,
                    latency_ms=latency_ms,
                )
        except requests.RequestException as exc:
            latency_ms = (time.monotonic() - start) * 1000
            last_error = str(exc)
        if attempt < attempts:
            time.sleep(1)

    return CheckResult(
        name=name,
        url=url,
        success=False,
        status=last_status,
        latency_ms=latency_ms,
        error=last_error,
    )


def send_slack_alert(failed: Sequence[CheckResult]) -> None:
    webhook = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook:
        return
    lines = [":rotating_light: *Uptime checks failing*"]
    for result in failed:
        detail = result.error or "Check failed"
        lines.append(f"• *{result.name}* → {result.url} — {detail}")
    payload = {"text": "\n".join(lines)}
    try:
        response = requests.post(webhook, json=payload, timeout=5)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"Failed to notify Slack: {exc}", file=sys.stderr)


def main() -> int:
    try:
        config = load_config()
    except UptimeCheckError as exc:
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        REPORT_PATH.write_text(
            json.dumps(
                [
                    {
                        "name": "configuration",
                        "url": "",
                        "success": False,
                        "status": None,
                        "latency_ms": None,
                        "error": str(exc),
                    }
                ],
                indent=2,
            )
        )
        print(str(exc), file=sys.stderr)
        send_slack_alert(
            [
                CheckResult(
                    name="configuration",
                    url="",
                    success=False,
                    status=None,
                    latency_ms=None,
                    error=str(exc),
                )
            ]
        )
        return 2

    results: List[CheckResult] = []
    for item in config:
        try:
            result = run_check(item)
        except UptimeCheckError as exc:
            results.append(
                CheckResult(
                    name=item.get("name") or item.get("url") or "<unknown>",
                    url=item.get("url") or "",
                    success=False,
                    status=None,
                    latency_ms=None,
                    error=str(exc),
                )
            )
        else:
            results.append(result)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps([r.to_dict() for r in results], indent=2))

    failed = [r for r in results if not r.success]
    if failed:
        send_slack_alert(failed)
        print("Some checks failed:")
        for result in failed:
            print(f"- {result.name}: {result.error or 'Unknown error'}", file=sys.stderr)
        return 1

    print("All uptime checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
