#!/usr/bin/env python3
"""Smoke test for Jetson Orin OpenAI-compatible server."""

import os
import time
from typing import Optional

import pytest
import requests


def chat_once(base_url: str) -> float:
    payload = {
        "model": os.getenv("OPENAI_MODEL", "dummy"),
        "messages": [{"role": "user", "content": "ping"}],
    }
    t0 = time.time()
    resp = requests.post(f"{base_url}/chat/completions", json=payload, timeout=10)
    dt = time.time() - t0
    resp.raise_for_status()
    data = resp.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    assert content.strip() != ""
    return dt


@pytest.mark.skipif(
    "BASE_URL" not in os.environ,
    reason="BASE_URL env var required for smoke test",
)
def test_chat_latency():
    base_url = os.environ["BASE_URL"]
    latency = chat_once(base_url)
    assert latency < 5, f"latency too high: {latency:.2f}s"


if __name__ == "__main__":  # pragma: no cover
    url = os.environ.get("BASE_URL")
    if not url:
        raise SystemExit("BASE_URL not set")
    print(f"latency: {chat_once(url):.2f}s")
