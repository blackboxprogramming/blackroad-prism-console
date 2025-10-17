"""Tiny client helper for talking to the vecd daemon."""
from __future__ import annotations

import json
import socket
from typing import Any, Dict, List, Optional

SOCK_PATH = "/run/vecd.sock"


def call(obj: Dict[str, Any]) -> Dict[str, Any]:
    data = json.dumps(obj).encode("utf-8") + b"\n"
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
        sock.connect(SOCK_PATH)
        sock.sendall(data)
        buf = b""
        while not buf.endswith(b"\n"):
            chunk = sock.recv(65536)
            if not chunk:
                break
            buf += chunk
    if not buf:
        raise RuntimeError("vecd returned no data")
    return json.loads(buf.decode("utf-8"))


def put(
    identifier: str,
    namespace: str,
    text: str,
    embedding: List[float],
    meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return call(
        {
            "op": "PUT",
            "id": identifier,
            "namespace": namespace,
            "text": text,
            "embedding": embedding,
            "meta": meta or {},
        }
    )


def get(identifier: str) -> Dict[str, Any]:
    return call({"op": "GET", "id": identifier})


def search(embedding: List[float], k: int = 8) -> Dict[str, Any]:
    return call({"op": "SEARCH", "embedding": embedding, "k": k})


def stats() -> Dict[str, Any]:
    return call({"op": "STATS"})
