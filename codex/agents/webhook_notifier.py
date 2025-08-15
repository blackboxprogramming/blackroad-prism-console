#!/usr/bin/env python3
"""Minimal JSON webhook notifier."""

import json
import urllib.request
from typing import Any, Dict


def send_webhook(url: str, payload: Dict[str, Any]):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        resp.read()
    return url

__all__ = ["send_webhook"]
