#!/usr/bin/env python3
"""Vector memory daemon for local agents."""
import json
import math
import os
import socket
import sqlite3
import struct
import threading
from typing import List, Tuple

# Optional ANN backend via hnswlib
try:  # pragma: no cover - optional dependency
    import hnswlib

    ANN = "hnsw"
except Exception:  # pragma: no cover - fall back to flat cosine
    hnswlib = None
    ANN = "flat"

DB_PATH = os.environ.get("VECD_DB_PATH", "/srv/blackroad/vecd.sqlite")
SOCK_PATH = os.environ.get("VECD_SOCK_PATH", "/run/vecd.sock")
DIM = int(os.environ.get("VECD_DIM", "384"))
MAX_RESULTS = int(os.environ.get("VECD_MAX_RESULTS", "12"))


def ensure_db() -> None:
    """Ensure the SQLite store exists."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute(
            """CREATE TABLE IF NOT EXISTS items(
              id TEXT PRIMARY KEY,
              namespace TEXT,
              text TEXT,
              meta TEXT,
              vec BLOB
            )"""
        )
        cur.execute(
            "CREATE INDEX IF NOT EXISTS ns_idx ON items(namespace)"
        )
        conn.commit()
    finally:
        conn.close()


def to_bytes(vec: List[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)


def to_vec(buf: bytes) -> List[float]:
    return list(struct.unpack(f"{len(buf) // 4}f", buf))


class Index:
    """In-memory index wrapping either hnswlib or cosine search."""

    def __init__(self) -> None:
        self.ids: List[str] = []
        self.vecs: List[List[float]] = []
        self.pos: dict[str, int] = {}
        self.lock = threading.Lock()
        self.hnsw = None

    def rebuild(self) -> None:
        with self.lock:
            conn = sqlite3.connect(DB_PATH)
            try:
                cur = conn.cursor()
                cur.execute("SELECT id, vec FROM items")
                rows = cur.fetchall()
            finally:
                conn.close()

            self.ids = [row[0] for row in rows]
            self.vecs = [to_vec(row[1]) for row in rows]
            self.pos = {identifier: idx for idx, identifier in enumerate(self.ids)}

            if ANN == "hnsw" and self.vecs:
                index = hnswlib.Index(space="cosine", dim=DIM)
                index.init_index(
                    max_elements=len(self.vecs), ef_construction=200, M=32
                )
                index.add_items(self.vecs, list(range(len(self.vecs))))
                index.set_ef(64)
                self.hnsw = index
            else:
                self.hnsw = None

    def add(self, identifier: str, vec: List[float]) -> None:
        with self.lock:
            if identifier in self.pos:
                return
            self.ids.append(identifier)
            self.vecs.append(vec)
            self.pos[identifier] = len(self.ids) - 1
            if self.hnsw is not None:
                self.hnsw.add_items([vec], [len(self.ids) - 1])

    def search(self, query: List[float], k: int = MAX_RESULTS) -> List[Tuple[str, float]]:
        with self.lock:
            if not self.vecs:
                return []

            if self.hnsw is not None:
                indices, dists = self.hnsw.knn_query([query], k=min(k, len(self.vecs)))
                return [
                    (self.ids[i], 1 - float(dist))
                    for i, dist in zip(indices[0], dists[0])
                ]

            # fallback cosine similarity
            def cosine(a: List[float], b: List[float]) -> float:
                dot = sum(x * y for x, y in zip(a, b))
                na = math.sqrt(sum(x * x for x in a))
                nb = math.sqrt(sum(x * x for x in b))
                if na == 0 or nb == 0:
                    return 0.0
                return dot / (na * nb)

            sims = [(self.ids[i], cosine(query, vec)) for i, vec in enumerate(self.vecs)]
            sims.sort(key=lambda item: item[1], reverse=True)
            return sims[:k]


def _ensure_remove_socket() -> None:
    if os.path.exists(SOCK_PATH):
        os.remove(SOCK_PATH)


def _ensure_socket_permissions(sock: socket.socket) -> None:
    os.chmod(SOCK_PATH, 0o666)


def handle(msg: dict) -> dict:
    op = msg.get("op", "").upper()

    if op == "STATS":
        return {"ok": True, "count": len(index.ids), "ann": ANN}

    if op == "PUT":
        identifier = msg["id"]
        namespace = msg.get("namespace", "default")
        text = msg.get("text", "")
        meta = json.dumps(msg.get("meta", {}))
        vec = msg.get("embedding")
        if not isinstance(vec, list) or len(vec) != DIM:
            return {"ok": False, "error": "bad-dim"}

        conn = sqlite3.connect(DB_PATH)
        try:
            cur = conn.cursor()
            cur.execute(
                "REPLACE INTO items(id,namespace,text,meta,vec) VALUES(?,?,?,?,?)",
                (identifier, namespace, text, meta, to_bytes(vec)),
            )
            conn.commit()
        finally:
            conn.close()

        index.add(identifier, vec)
        return {"ok": True}

    if op == "GET":
        identifier = msg["id"]
        conn = sqlite3.connect(DB_PATH)
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT id,namespace,text,meta FROM items WHERE id=?", (identifier,)
            )
            row = cur.fetchone()
        finally:
            conn.close()
        if not row:
            return {"ok": False, "error": "not-found"}
        return {
            "ok": True,
            "item": {
                "id": row[0],
                "namespace": row[1],
                "text": row[2],
                "meta": json.loads(row[3]),
            },
        }

    if op == "SEARCH":
        vec = msg.get("embedding")
        k = int(msg.get("k", MAX_RESULTS))
        if not isinstance(vec, list) or len(vec) != DIM:
            return {"ok": False, "error": "bad-dim"}

        hits = index.search(vec, k)
        if not hits:
            return {"ok": True, "results": []}

        conn = sqlite3.connect(DB_PATH)
        try:
            cur = conn.cursor()
            results = []
            for identifier, score in hits:
                cur.execute(
                    "SELECT namespace,text,meta FROM items WHERE id=?", (identifier,)
                )
                row = cur.fetchone()
                if row:
                    results.append(
                        {
                            "id": identifier,
                            "score": score,
                            "namespace": row[0],
                            "text": row[1],
                            "meta": json.loads(row[2]),
                        }
                    )
        finally:
            conn.close()

        return {"ok": True, "results": results}

    return {"ok": False, "error": "unknown-op"}


def serve() -> None:
    ensure_db()
    index.rebuild()
    _ensure_remove_socket()
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.bind(SOCK_PATH)
    _ensure_socket_permissions(sock)
    sock.listen(64)
    while True:
        conn, _ = sock.accept()
        threading.Thread(target=client, args=(conn,), daemon=True).start()


def client(conn: socket.socket) -> None:
    buf = b""
    try:
        while True:
            chunk = conn.recv(65536)
            if not chunk:
                break
            buf += chunk
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                if not line:
                    continue
                try:
                    req = json.loads(line.decode("utf-8"))
                    res = handle(req)
                except Exception as exc:  # pragma: no cover - defensive
                    res = {"ok": False, "error": str(exc)}
                conn.sendall((json.dumps(res) + "\n").encode("utf-8"))
    finally:
        conn.close()


index = Index()

if __name__ == "__main__":
    serve()
