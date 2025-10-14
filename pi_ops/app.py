"""Pi-Ops dashboard FastAPI application.

This service bridges MQTT telemetry into a lightweight
operations dashboard. It subscribes to key topics,
persists a rolling history into SQLite, and exposes
Server-Sent Events (SSE) for live updates.
"""
from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import threading
import time
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, Iterable, List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
import paho.mqtt.client as mqtt


DEFAULT_TOPICS: tuple[str, ...] = (
    "system/heartbeat/#",
    "agent/output",
    "#",
)
DEFAULT_MAX_MESSAGES = 1000
DB_FILENAME = "ops.db"


@dataclass(slots=True)
class Message:
    """Persisted MQTT message."""

    id: Optional[int]
    topic: str
    payload: str
    created_at: float

    def asdict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "topic": self.topic,
            "payload": self.payload,
            "created_at": self.created_at,
        }


@dataclass(slots=True)
class TopicStat:
    """Aggregated view of message activity per topic."""

    topic: str
    count: int
    last_seen: float

    def asdict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "count": self.count,
            "last_seen": self.last_seen,
        }


class MessageStore:
    """SQLite-backed ring buffer for MQTT messages."""

    def __init__(self, db_path: Path, max_messages: int = DEFAULT_MAX_MESSAGES) -> None:
        self._db_path = db_path
        self._max_messages = max_messages
        self._lock = threading.Lock()
        self._connection = sqlite3.connect(db_path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._initialise()

    def _initialise(self) -> None:
        with closing(self._connection.cursor()) as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    topic TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL
                )
                """
            )
            self._connection.commit()

    def insert(self, message: Message) -> Message:
        with self._lock, closing(self._connection.cursor()) as cursor:
            cursor.execute(
                "INSERT INTO messages (topic, payload, created_at) VALUES (?, ?, ?)",
                (message.topic, message.payload, message.created_at),
            )
            message.id = cursor.lastrowid
            cursor.execute(
                """
                DELETE FROM messages
                WHERE id NOT IN (
                    SELECT id FROM messages ORDER BY id DESC LIMIT ?
                )
                """,
                (self._max_messages,),
            )
            self._connection.commit()
        return message

    def recent(self, limit: int = 100) -> List[Message]:
        with self._lock, closing(self._connection.cursor()) as cursor:
            cursor.execute(
                "SELECT id, topic, payload, created_at FROM messages ORDER BY id DESC LIMIT ?",
                (limit,),
            )
            rows = cursor.fetchall()
        return [Message(id=row["id"], topic=row["topic"], payload=row["payload"], created_at=row["created_at"]) for row in rows]

    def topic_stats(self, limit: int = 10) -> List[TopicStat]:
        limit = max(1, limit)
        with self._lock, closing(self._connection.cursor()) as cursor:
            cursor.execute(
                """
                SELECT topic, COUNT(*) AS count, MAX(created_at) AS last_seen
                FROM messages
                GROUP BY topic
                ORDER BY last_seen DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
        return [TopicStat(topic=row["topic"], count=row["count"], last_seen=row["last_seen"]) for row in rows]

    def close(self) -> None:
        with self._lock:
            self._connection.close()


class EventBus:
    """In-memory pub/sub for SSE streams."""

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[str]] = set()
        self._lock = asyncio.Lock()

    async def publish(self, data: Dict[str, Any]) -> None:
        payload = json.dumps(data, ensure_ascii=False)
        async with self._lock:
            for queue in list(self._subscribers):
                await queue.put(payload)

    async def subscribe(self) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue()
        async with self._lock:
            self._subscribers.add(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[str]) -> None:
        async with self._lock:
            self._subscribers.discard(queue)


class Bus:
    """MQTT bridge handling subscriptions and event fan-out."""

    def __init__(
        self,
        store: MessageStore,
        event_bus: EventBus,
        topics: Iterable[str],
        hostname: str,
        port: int,
        client_id: str,
        username: Optional[str],
        password: Optional[str],
        keepalive: int = 60,
    ) -> None:
        self._store = store
        self._event_bus = event_bus
        self._topics = list(topics)
        self._hostname = hostname
        self._port = port
        self._client_id = client_id
        self._username = username
        self._password = password
        self._keepalive = keepalive
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._client = mqtt.Client(client_id=self._client_id, clean_session=True)
        if self._username:
            self._client.username_pw_set(self._username, password=self._password)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect
        self._client_lock = threading.Lock()

    def start(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop
        with self._client_lock:
            # Use asynchronous connect so startup succeeds even if the broker is
            # offline. Paho will retry automatically according to its internal
            # backoff.
            self._client.connect_async(self._hostname, self._port, self._keepalive)
            self._client.loop_start()

    def stop(self) -> None:
        with self._client_lock:
            try:
                self._client.loop_stop()
            finally:
                self._client.disconnect()

    def publish(self, topic: str, payload: str, qos: int = 0, retain: bool = False) -> None:
        with self._client_lock:
            result = self._client.publish(topic, payload=payload, qos=qos, retain=retain)
        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            raise RuntimeError(f"MQTT publish failed with rc={result.rc}")

    # MQTT callbacks -----------------------------------------------------
    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: Dict[str, Any], rc: int) -> None:
        if rc != 0:
            print(f"[MQTT] Connection failed with rc={rc}")
            return
        print("[MQTT] Connected")
        for topic in self._topics:
            client.subscribe(topic)
            print(f"[MQTT] Subscribed to {topic}")

    def _on_disconnect(self, _client: mqtt.Client, _userdata: Any, rc: int) -> None:
        if rc != 0:
            print(f"[MQTT] Unexpected disconnect rc={rc}")
        else:
            print("[MQTT] Disconnected")

    def _on_message(self, _client: mqtt.Client, _userdata: Any, message: mqtt.MQTTMessage) -> None:
        payload = message.payload.decode("utf-8", errors="replace")
        stored = self._store.insert(
            Message(
                id=None,
                topic=message.topic,
                payload=payload,
                created_at=time.time(),
            )
        )
        if self._loop is not None:
            asyncio.run_coroutine_threadsafe(
                self._event_bus.publish({
                    "type": "message",
                    "data": stored.asdict(),
                }),
                self._loop,
            )


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


def _env_json(name: str, default: Iterable[str]) -> List[str]:
    raw = os.environ.get(name)
    if not raw:
        return list(default)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return [item.strip() for item in raw.split(",") if item.strip()]
    if isinstance(parsed, list):
        return [str(item) for item in parsed]
    return list(default)


def create_app() -> FastAPI:
    base_dir = Path(__file__).resolve().parent
    db_path = base_dir / DB_FILENAME
    max_messages = _env_int("PI_OPS_MAX_MESSAGES", DEFAULT_MAX_MESSAGES)
    topics = _env_json("PI_OPS_TOPICS", DEFAULT_TOPICS)
    mqtt_host = _env("PI_OPS_MQTT_HOST", "localhost")
    mqtt_port = _env_int("PI_OPS_MQTT_PORT", 1883)
    mqtt_client_id = _env("PI_OPS_CLIENT_ID", "pi-ops-dashboard")
    mqtt_username = os.environ.get("PI_OPS_MQTT_USERNAME")
    mqtt_password = os.environ.get("PI_OPS_MQTT_PASSWORD")

    store = MessageStore(db_path, max_messages=max_messages)
    events = EventBus()
    bus = Bus(
        store=store,
        event_bus=events,
        topics=topics,
        hostname=mqtt_host,
        port=mqtt_port,
        client_id=mqtt_client_id,
        username=mqtt_username,
        password=mqtt_password,
    )

    app = FastAPI(title="Pi-Ops Dashboard", version="0.1.0")

    @app.on_event("startup")
    async def startup() -> None:  # pragma: no cover - FastAPI managed
        loop = asyncio.get_running_loop()
        bus.start(loop)
        # preload recent messages into SSE stream so clients see history on connect
        for message in reversed(store.recent(limit=25)):
            await events.publish({"type": "message", "data": message.asdict()})

    @app.on_event("shutdown")
    async def shutdown() -> None:  # pragma: no cover - FastAPI managed
        bus.stop()
        store.close()

    def get_store() -> MessageStore:
        return store

    def get_bus() -> Bus:
        return bus

    def get_events() -> EventBus:
        return events

    # ------------------------------------------------------------------
    @app.get("/", response_class=HTMLResponse)
    async def index() -> str:
        return DASHBOARD_HTML

    @app.get("/api/messages")
    async def api_messages(limit: int = 100, store: MessageStore = Depends(get_store)) -> Dict[str, Any]:
        limit = max(1, min(limit, max_messages))
        return {
            "messages": [msg.asdict() for msg in store.recent(limit=limit)],
        }

    @app.get("/api/stats")
    async def api_stats(limit: int = 25, store: MessageStore = Depends(get_store)) -> Dict[str, Any]:
        limit = max(1, min(limit, max_messages))
        return {
            "topics": [stat.asdict() for stat in store.topic_stats(limit=limit)],
        }

    @app.post("/api/publish")
    async def api_publish(payload: Dict[str, Any]) -> JSONResponse:
        topic = payload.get("topic")
        if not topic:
            raise HTTPException(status_code=400, detail="Missing topic")
        message = payload.get("message")
        if message is None:
            raise HTTPException(status_code=400, detail="Missing message")
        qos = int(payload.get("qos", 0))
        retain = bool(payload.get("retain", False))
        if isinstance(message, (dict, list)):
            body = json.dumps(message)
        else:
            body = str(message)
        try:
            get_bus().publish(topic, body, qos=qos, retain=retain)
        except RuntimeError as exc:  # pragma: no cover - network failure
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        return JSONResponse({"status": "published"})

    @app.get("/events")
    async def sse(events_bus: EventBus = Depends(get_events)) -> StreamingResponse:
        queue = await events_bus.subscribe()

        async def event_stream() -> AsyncGenerator[bytes, None]:
            try:
                while True:
                    data = await queue.get()
                    yield f"data: {data}\n\n".encode("utf-8")
            finally:
                await events_bus.unsubscribe(queue)

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    return app


DASHBOARD_HTML = """<!DOCTYPE html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <title>Pi-Ops Dashboard</title>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f172a;
        --panel: #1e293b;
        --accent: #38bdf8;
        --text: #e2e8f0;
        --muted: #64748b;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      body {
        margin: 0;
        padding: 0;
        background: var(--bg);
        color: var(--text);
        display: flex;
        min-height: 100vh;
        flex-direction: column;
      }
      header {
        padding: 1.5rem 2rem 1rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(14, 116, 144, 0.06));
        box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
      }
      h1 {
        margin: 0;
        font-size: 1.8rem;
        letter-spacing: 0.02em;
      }
      main {
        flex: 1;
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 1.5rem;
        padding: 1.5rem 2rem 2.5rem;
      }
      @media (max-width: 960px) {
        main {
          display: flex;
          flex-direction: column;
        }
      }
      section {
        background: var(--panel);
        border: 1px solid rgba(148, 163, 184, 0.12);
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
      }
      .section-title {
        margin: 0 0 0.75rem;
        font-size: 1.1rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      form {
        display: grid;
        gap: 0.75rem;
      }
      label {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--muted);
      }
      input, textarea, select {
        background: rgba(15, 23, 42, 0.7);
        color: var(--text);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 10px;
        padding: 0.65rem 0.75rem;
        font-size: 0.95rem;
        font-family: inherit;
        transition: border 0.2s ease, box-shadow 0.2s ease;
      }
      input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18);
      }
      button {
        background: linear-gradient(135deg, var(--accent), #0ea5e9);
        border: none;
        border-radius: 999px;
        padding: 0.7rem 1.2rem;
        color: #0f172a;
        font-weight: 600;
        font-size: 0.95rem;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 15px 35px rgba(56, 189, 248, 0.35);
      }
      .messages {
        display: grid;
        gap: 0.75rem;
        max-height: calc(100vh - 260px);
        overflow-y: auto;
        padding-right: 0.5rem;
      }
      .message {
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.12);
        padding: 0.85rem;
        background: rgba(15, 23, 42, 0.65);
        box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
      }
      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.45rem;
        font-size: 0.85rem;
        letter-spacing: 0.03em;
        color: var(--muted);
      }
      .message-topic {
        font-weight: 600;
        color: var(--accent);
        word-break: break-word;
      }
      .message-payload {
        font-family: "JetBrains Mono", "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
        color: #f1f5f9;
      }
      .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 0.45rem;
      }
      .status-online {
        background: #4ade80;
        box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
      }
      .status-offline {
        background: #f87171;
        box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.18);
      }
      .topic-stats {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }
      .topic-stat {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.65rem 0.75rem;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.16);
      }
      .topic-label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .topic-label strong {
        font-weight: 600;
        font-size: 0.95rem;
      }
      .count-badge {
        background: rgba(56, 189, 248, 0.18);
        color: var(--accent);
        font-weight: 600;
        font-size: 0.85rem;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        align-self: center;
      }
      .heartbeat-list {
        display: grid;
        gap: 0.5rem;
        font-size: 0.85rem;
        max-height: 200px;
        overflow-y: auto;
        padding-right: 0.25rem;
      }
      .heartbeat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.65rem;
        border-radius: 12px;
        background: rgba(148, 163, 184, 0.08);
      }
      .heartbeat-item span {
        word-break: break-word;
      }
      .muted {
        color: var(--muted);
      }
      .timestamp {
        font-variant-numeric: tabular-nums;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Pi-Ops Telemetry</h1>
      <p class=\"muted\">Live MQTT feed, last 1,000 messages, quick publish controls.</p>
    </header>
    <main>
      <section>
        <h2 class=\"section-title\">Quick Publish</h2>
        <form id=\"publish-form\">
          <div>
            <label for=\"topic\">Topic</label>
            <input id=\"topic\" name=\"topic\" placeholder=\"system/test\" required />
          </div>
          <div>
            <label for=\"message\">Payload</label>
            <textarea id=\"message\" name=\"message\" rows=\"4\" placeholder=\"{&quot;ok&quot;:true}\" required></textarea>
          </div>
          <div style=\"display:flex; gap:0.75rem;\">
            <div style=\"flex:1;\">
              <label for=\"qos\">QoS</label>
              <select id=\"qos\" name=\"qos\">
                <option value=\"0\">0</option>
                <option value=\"1\">1</option>
                <option value=\"2\">2</option>
              </select>
            </div>
            <div style=\"display:flex; align-items:flex-end; gap:0.5rem;\">
              <input type=\"checkbox\" id=\"retain\" name=\"retain\" />
              <label for=\"retain\">Retain</label>
            </div>
          </div>
          <button type=\"submit\">Publish</button>
          <p id=\"publish-status\" class=\"muted\"></p>
        </form>
        <h2 class=\"section-title\" style=\"margin-top:2rem;\">Topic Activity</h2>
        <div id=\"topic-stats\" class=\"topic-stats\"></div>
        <h2 class=\"section-title\" style=\"margin-top:2rem;\">Heartbeats</h2>
        <div id=\"heartbeat-list\" class=\"heartbeat-list\"></div>
      </section>
      <section>
        <h2 class=\"section-title\">Recent Messages</h2>
        <div id=\"messages\" class=\"messages\"></div>
      </section>
    </main>
    <script>
      const messagesContainer = document.getElementById('messages');
      const heartbeatList = document.getElementById('heartbeat-list');
      const topicStatsContainer = document.getElementById('topic-stats');
      const publishForm = document.getElementById('publish-form');
      const publishStatus = document.getElementById('publish-status');

      const heartbeatState = new Map();
      const topicStats = new Map();

      function iso(ts) {
        try {
          return new Date(ts * 1000).toISOString();
        } catch (err) {
          return '';
        }
      }

      function renderMessages(entries) {
        for (const entry of entries) {
          const card = document.createElement('div');
          card.className = 'message';
          const header = document.createElement('div');
          header.className = 'message-header';
          const topic = document.createElement('span');
          topic.className = 'message-topic';
          topic.textContent = entry.topic;
          const timestamp = document.createElement('span');
          timestamp.className = 'timestamp muted';
          timestamp.textContent = iso(entry.created_at);
          header.appendChild(topic);
          header.appendChild(timestamp);
          const payload = document.createElement('pre');
          payload.className = 'message-payload';
          let text = entry.payload;
          try {
            const parsed = JSON.parse(entry.payload);
            text = JSON.stringify(parsed, null, 2);
          } catch (_) {
            // leave as plain text
          }
          payload.textContent = text;
          card.appendChild(header);
          card.appendChild(payload);
          messagesContainer.prepend(card);
          while (messagesContainer.children.length > 200) {
            messagesContainer.removeChild(messagesContainer.lastChild);
          }
          updateTopicStats(entry);
          if (entry.topic.startsWith('system/heartbeat')) {
            heartbeatState.set(entry.topic, {
              payload: text,
              created_at: entry.created_at,
            });
            renderHeartbeats();
          }
        }
      }

      function renderHeartbeats() {
        heartbeatList.textContent = '';
        const items = Array.from(heartbeatState.entries()).sort((a, b) => b[1].created_at - a[1].created_at);
        for (const [topic, info] of items) {
          const item = document.createElement('div');
          item.className = 'heartbeat-item';
          const left = document.createElement('span');
          const dot = document.createElement('span');
          dot.className = 'status-dot status-online';
          left.appendChild(dot);
          left.appendChild(document.createTextNode(topic));
          const right = document.createElement('span');
          right.className = 'timestamp muted';
          right.textContent = iso(info.created_at);
          item.appendChild(left);
          item.appendChild(right);
          heartbeatList.appendChild(item);
        }
        if (!items.length) {
          const placeholder = document.createElement('p');
          placeholder.className = 'muted';
          placeholder.textContent = 'No heartbeats received yet.';
          heartbeatList.appendChild(placeholder);
        }
      }

      function renderTopicStats() {
        topicStatsContainer.textContent = '';
        const items = Array.from(topicStats.entries())
          .sort((a, b) => b[1].last_seen - a[1].last_seen)
          .slice(0, 25);
        if (!items.length) {
          const placeholder = document.createElement('p');
          placeholder.className = 'muted';
          placeholder.textContent = 'No topics observed yet.';
          topicStatsContainer.appendChild(placeholder);
          return;
        }
        for (const [topic, info] of items) {
          const item = document.createElement('div');
          item.className = 'topic-stat';
          const label = document.createElement('div');
          label.className = 'topic-label';
          const title = document.createElement('strong');
          title.textContent = topic;
          label.appendChild(title);
          const meta = document.createElement('span');
          meta.className = 'timestamp muted';
          const last = iso(Number(info.last_seen));
          meta.textContent = last ? `Last ${last}` : 'Last seen —';
          label.appendChild(meta);
          const badge = document.createElement('span');
          badge.className = 'count-badge';
          badge.textContent = info.count;
          item.appendChild(label);
          item.appendChild(badge);
          topicStatsContainer.appendChild(item);
        }
      }

      function updateTopicStats(entry) {
        if (!entry || !entry.topic) {
          return;
        }
        const createdAt = Number(entry.created_at) || 0;
        const existing = topicStats.get(entry.topic);
        if (existing) {
          if (createdAt > existing.last_seen) {
            existing.last_seen = createdAt;
            existing.count += 1;
            topicStats.set(entry.topic, existing);
            renderTopicStats();
          }
        } else {
          topicStats.set(entry.topic, { count: 1, last_seen: createdAt });
          renderTopicStats();
        }
      }

      async function loadStats() {
        try {
          const res = await fetch('/api/stats?limit=50');
          const data = await res.json();
          topicStats.clear();
          const entries = data.topics || [];
          for (const stat of entries) {
            topicStats.set(stat.topic, { count: stat.count, last_seen: stat.last_seen });
          }
          renderTopicStats();
        } catch (err) {
          console.error('stats load error', err);
          topicStatsContainer.textContent = '';
          const placeholder = document.createElement('p');
          placeholder.className = 'muted';
          placeholder.textContent = 'Unable to load topic stats.';
          topicStatsContainer.appendChild(placeholder);
        }
      }

      async function loadRecent() {
        const res = await fetch('/api/messages?limit=100');
        const data = await res.json();
        const entries = data.messages || [];
        entries.reverse();
        renderMessages(entries);
      }

      function setupSSE() {
        const source = new EventSource('/events');
        source.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'message') {
              renderMessages([payload.data]);
            }
          } catch (err) {
            console.error('event parse error', err);
          }
        };
        source.onerror = (err) => {
          console.error('SSE error', err);
        };
      }

      publishForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(publishForm);
        const body = {
          topic: formData.get('topic'),
          message: formData.get('message'),
          qos: parseInt(formData.get('qos'), 10) || 0,
          retain: formData.get('retain') === 'on',
        };
        publishStatus.textContent = 'Publishing…';
        try {
          const res = await fetch('/api/publish', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Publish failed');
          }
          publishStatus.textContent = 'Message published';
          publishForm.reset();
          setTimeout(() => publishStatus.textContent = '', 2500);
        } catch (err) {
          publishStatus.textContent = String(err);
        }
      });

      async function init() {
        renderTopicStats();
        await loadStats();
        await loadRecent();
        setupSSE();
        renderHeartbeats();
      }

      init();
    </script>
  </body>
</html>
"""


app = create_app()
