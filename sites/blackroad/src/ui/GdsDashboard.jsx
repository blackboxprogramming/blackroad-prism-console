import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WS_URL = "wss://mission-control.blackroad.local/gds";
const METRIC_COLORS = ["#38bdf8", "#c084fc", "#f97316", "#34d399"];
const MAX_TELEMETRY_POINTS = 120;
const MAX_EVENTS = 16;
const MAX_COMMANDS = 12;
const INITIAL_CONNECTION = { state: "connecting", attempts: 0 };

export default function GdsDashboard() {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectDelayRef = useRef(2500);
  const attemptRef = useRef(0);
  const canvasRef = useRef(null);

  const [connection, setConnection] = useState(INITIAL_CONNECTION);
  const [health, setHealth] = useState({
    status: "Unknown",
    summary: "",
    subsystems: [],
    updatedAt: null,
  });
  const [telemetry, setTelemetry] = useState([]);
  const [events, setEvents] = useState([]);
  const [commands, setCommands] = useState([]);

  const handleInbound = useCallback((event) => {
    if (typeof event?.data !== "string") return;
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      console.warn("GDS dashboard: unable to parse payload", error);
      return;
    }

    const normalizedType = typeof payload?.type === "string" ? payload.type.toLowerCase() : "";
    const hasSubsystems = Array.isArray(payload?.subsystems);
    const hasMetrics =
      (payload?.metrics && (Array.isArray(payload.metrics) || typeof payload.metrics === "object")) ||
      (typeof payload?.metric === "string" && payload?.value !== undefined);

    if (normalizedType === "health" || normalizedType === "heartbeat" || hasSubsystems) {
      setHealth((previous) => {
        const status = payload?.status || payload?.state || payload?.health || previous.status;
        const summary = payload?.summary || payload?.message || previous.summary;
        const subsystems = extractSubsystems(payload?.subsystems, previous.subsystems);
        const updatedAt = parseDate(payload?.timestamp || payload?.time || payload?.updatedAt) || new Date();
        return { status, summary, subsystems, updatedAt };
      });
      return;
    }

    if (normalizedType === "telemetry" || hasMetrics) {
      const entry = normaliseTelemetry(payload);
      if (!entry) return;
      setTelemetry((history) => [...history, entry].slice(-MAX_TELEMETRY_POINTS));
      return;
    }

    if (
      normalizedType === "event" ||
      normalizedType === "alert" ||
      normalizedType === "anomaly" ||
      payload?.event
    ) {
      const record = normaliseEvent(payload);
      setEvents((list) => {
        const deduped = list.filter((item) => item.id !== record.id);
        return [record, ...deduped].slice(0, MAX_EVENTS);
      });
      return;
    }

    if (
      normalizedType === "command_ack" ||
      normalizedType === "command-ack" ||
      normalizedType === "commandack" ||
      normalizedType === "command" ||
      payload?.commandId ||
      payload?.command
    ) {
      const command = normaliseCommand(payload);
      setCommands((queue) => {
        const deduped = queue.filter((item) => item.id !== command.id);
        return [command, ...deduped].slice(0, MAX_COMMANDS);
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(reconnectDelayRef.current, 15000);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.6, 15000);
        connect();
      }, delay);
    };

    const connect = () => {
      const Socket = globalThis?.WebSocket;
      if (typeof Socket !== "function") {
        setConnection({ state: "unsupported", attempts: attemptRef.current });
        return;
      }

      attemptRef.current += 1;
      const attempt = attemptRef.current;
      setConnection({ state: attempt === 1 ? "connecting" : "reconnecting", attempts: attempt });

      const ws = new Socket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        reconnectDelayRef.current = 2500;
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        setConnection({ state: "online", attempts: attempt });
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnection({ state: "offline", attempts: attempt });
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (cancelled) return;
        setConnection({ state: "error", attempts: attempt });
      };

      ws.onmessage = handleInbound;
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
    };
  }, [handleInbound]);

  const metricKeys = useMemo(() => {
    const keys = new Set();
    for (const entry of telemetry) {
      if (!entry?.metrics) continue;
      Object.entries(entry.metrics).forEach(([key, value]) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          keys.add(key);
        }
      });
      if (keys.size >= METRIC_COLORS.length) break;
    }
    return Array.from(keys).slice(0, METRIC_COLORS.length);
  }, [telemetry]);

  const metricRanges = useMemo(() => {
    const ranges = {};
    for (const key of metricKeys) {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const entry of telemetry) {
        const value = entry?.metrics?.[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        min = 0;
        max = 1;
      }
      if (min === max) {
        max = min + 1;
      }
      ranges[key] = { min, max };
    }
    return ranges;
  }, [telemetry, metricKeys]);

  const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  useEffect(() => {
    drawTelemetry(canvasRef.current, telemetry, metricKeys, metricRanges);
  }, [telemetry, metricKeys, metricRanges]);

  return (
    <div className="space-y-6 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Ground Data System</h2>
          <p className="text-xs text-slate-400">Live stream from mission control via Lucidia bridge.</p>
        </div>
        <ConnectionBadge status={connection.state} attempts={connection.attempts} />
      </header>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <HealthPanel health={health} />
          <TelemetryPanel
            history={telemetry}
            metricKeys={metricKeys}
            ranges={metricRanges}
            latest={latestTelemetry}
            canvasRef={canvasRef}
          />
        </div>
        <div className="space-y-4">
          <EventsPanel events={events} />
          <CommandPanel commands={commands} />
        </div>
      </div>
    </div>
  );
}

function extractSubsystems(incoming, fallback) {
  if (!incoming || !Array.isArray(incoming)) return Array.isArray(fallback) ? fallback : [];
  return incoming
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return {
          name: `Subsystem ${index + 1}`,
          state: "unknown",
          detail: "",
        };
      }
      const name = entry.name || entry.id || entry.subsystem || `Subsystem ${index + 1}`;
      const state = entry.state || entry.status || entry.health || "unknown";
      const detail = entry.detail || entry.description || entry.summary || "";
      return { name, state, detail };
    })
    .filter(Boolean);
}

function normaliseTelemetry(payload) {
  const metrics = {};
  if (Array.isArray(payload?.metrics)) {
    for (const item of payload.metrics) {
      if (!item || typeof item !== "object") continue;
      const key = item.name || item.metric || item.id;
      const value = item.value ?? item.reading ?? item.v ?? item.measure;
      if (!key) continue;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) metrics[key] = numeric;
    }
  } else if (payload?.metrics && typeof payload.metrics === "object") {
    for (const [key, value] of Object.entries(payload.metrics)) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) metrics[key] = numeric;
    }
  }

  if (typeof payload?.metric === "string") {
    const numeric = Number(payload?.value ?? payload?.reading ?? payload?.measure ?? payload?.v);
    if (Number.isFinite(numeric)) metrics[payload.metric] = numeric;
  }

  const metricKeys = Object.keys(metrics);
  if (metricKeys.length === 0) return null;

  const timestamp =
    parseDate(payload?.timestamp || payload?.time || payload?.ts || payload?.recordedAt) || new Date();

  return {
    timestamp,
    metrics,
  };
}

function normaliseEvent(payload) {
  const source = payload?.event && typeof payload.event === "object" ? payload.event : payload;
  const id = source.id || payload?.id || createId("evt");
  const severity = source.severity || source.level || source.priority || "info";
  const summary = source.summary || source.title || source.message || "Event received";
  const detail = source.detail || source.description || source.note || "";
  const timestamp = parseDate(source.timestamp || source.time || source.occurredAt || payload?.timestamp) || new Date();
  return { id, severity, summary, detail, timestamp };
}

function normaliseCommand(payload) {
  const id = payload?.commandId || payload?.id || payload?.sequence || createId("cmd");
  const name = payload?.command || payload?.name || payload?.route || "Command";
  const status = payload?.status || payload?.state || payload?.result || "unknown";
  const detail = payload?.detail || payload?.description || payload?.message || payload?.reason || "";
  const acceptedAt = parseDate(payload?.acceptedAt || payload?.timestamp || payload?.time || payload?.queuedAt);
  const completedAt = parseDate(
    payload?.completedAt || payload?.doneAt || payload?.finishedAt || payload?.ackedAt || payload?.resolvedAt,
  );
  return {
    id,
    name,
    status,
    detail,
    acceptedAt,
    completedAt,
  };
}

function ConnectionBadge({ status, attempts }) {
  const config = (() => {
    switch (status) {
      case "online":
        return { label: "Live link established", tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" };
      case "connecting":
        return { label: "Connecting to mission control…", tone: "border-amber-500/40 bg-amber-500/10 text-amber-200" };
      case "reconnecting":
        return {
          label: `Reconnecting (attempt ${Math.max(attempts, 1)})`,
          tone: "border-amber-500/40 bg-amber-500/10 text-amber-200",
        };
      case "offline":
        return { label: "Link lost — retrying", tone: "border-amber-500/40 bg-amber-500/10 text-amber-200" };
      case "error":
        return { label: "Socket error", tone: "border-rose-500/40 bg-rose-500/10 text-rose-200" };
      case "unsupported":
        return { label: "WebSocket unavailable", tone: "border-slate-700 bg-slate-800/80 text-slate-300" };
      default:
        return { label: "Idle", tone: "border-slate-700 bg-slate-800/80 text-slate-300" };
    }
  })();

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${config.tone}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

function HealthPanel({ health }) {
  const statusTone = resolveStatusTone(health.status);
  const updatedTime = formatTimestamp(health.updatedAt);
  const updatedAgo = formatAgo(health.updatedAt);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-slate-950/30">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Flight Computer Health</h3>
          <p className="text-xs text-slate-400">
            {updatedTime ? `Updated ${updatedTime}${updatedAgo ? ` • ${updatedAgo}` : ""}` : "Awaiting heartbeat"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone.className}`}>
          {statusTone.label}
        </span>
      </header>

      {health.summary && <p className="mt-3 text-sm text-slate-300">{health.summary}</p>}

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {health.subsystems.length === 0 ? (
          <li className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-400">
            No subsystem reports yet.
          </li>
        ) : (
          health.subsystems.map((subsystem) => {
            const tone = resolveStatusTone(subsystem.state);
            return (
              <li
                key={subsystem.name}
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-100">{subsystem.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}>
                    {tone.label}
                  </span>
                </div>
                {subsystem.detail && <p className="mt-1 text-xs text-slate-400">{subsystem.detail}</p>}
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

function TelemetryPanel({ history, metricKeys, ranges, latest, canvasRef }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-slate-950/30">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Realtime Telemetry</h3>
          <p className="text-xs text-slate-400">
            {latest?.timestamp ? `Last packet ${formatTimestamp(latest.timestamp)} • ${formatAgo(latest.timestamp)}` : "Waiting"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {metricKeys.length === 0 ? (
            <span className="text-slate-400">No metrics reported yet.</span>
          ) : (
            metricKeys.map((key, index) => {
              const value = latest?.metrics?.[key];
              return (
                <span key={key} className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: METRIC_COLORS[index % METRIC_COLORS.length] }}
                  />
                  <span className="uppercase text-[11px] text-slate-400">{key}</span>
                  <span className="font-mono text-slate-200">{formatNumber(value)}</span>
                </span>
              );
            })
          )}
        </div>
      </header>

      <div className="relative mt-4 h-48 overflow-hidden rounded-lg border border-slate-900 bg-slate-950/60">
        <canvas ref={canvasRef} className="h-full w-full" />
        {(history.length === 0 || metricKeys.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
            Awaiting telemetry…
          </div>
        )}
      </div>
      {metricKeys.length > 0 && (
        <div className="mt-3 grid gap-2 text-[11px] text-slate-400 sm:grid-cols-2">
          {metricKeys.map((key) => {
            const range = ranges[key];
            return (
              <div key={`${key}-range`} className="flex items-center justify-between rounded border border-slate-900/60 bg-slate-900/40 px-2 py-1">
                <span className="uppercase tracking-wide">{key}</span>
                <span className="font-mono text-slate-300">
                  {formatNumber(range?.min)} – {formatNumber(range?.max)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EventsPanel({ events }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-slate-950/30">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Events & anomalies</h3>
        <span className="text-xs text-slate-400">{events.length} active</span>
      </header>
      <div className="mt-3 space-y-2 overflow-auto pr-1 text-sm" style={{ maxHeight: "16rem" }}>
        {events.length === 0 ? (
          <p className="rounded border border-slate-900/60 bg-slate-900/40 p-3 text-xs text-slate-400">
            Standing by for alerts from mission control.
          </p>
        ) : (
          events.map((event) => {
            const tone = resolveSeverityTone(event.severity);
            return (
              <article
                key={event.id}
                className="space-y-1 rounded-lg border border-slate-900/60 bg-slate-900/40 p-3 text-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-100">{event.summary}</h4>
                    {event.detail && <p className="text-xs text-slate-400">{event.detail}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}>
                    {tone.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {formatTimestamp(event.timestamp)} • {formatAgo(event.timestamp)}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function CommandPanel({ commands }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-slate-950/30">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Command queue</h3>
        <span className="text-xs text-slate-400">{commands.length} tracked</span>
      </header>
      <div className="mt-3 space-y-2 overflow-auto pr-1 text-sm" style={{ maxHeight: "14rem" }}>
        {commands.length === 0 ? (
          <p className="rounded border border-slate-900/60 bg-slate-900/40 p-3 text-xs text-slate-400">
            Awaiting command acknowledgements.
          </p>
        ) : (
          commands.map((command) => {
            const tone = resolveStatusTone(command.status);
            return (
              <article
                key={command.id}
                className="space-y-1 rounded-lg border border-slate-900/60 bg-slate-900/40 p-3 text-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-slate-100">{command.name}</h4>
                    {command.detail && <p className="text-xs text-slate-400">{command.detail}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}>
                    {tone.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>
                    Accepted {formatTimestamp(command.acceptedAt)}
                    {command.acceptedAt && ` • ${formatAgo(command.acceptedAt)}`}
                  </span>
                  {command.completedAt && (
                    <span>
                      Completed {formatTimestamp(command.completedAt)} • {formatAgo(command.completedAt)}
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function drawTelemetry(canvas, history, metricKeys, ranges) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.offsetWidth || 480;
  const height = canvas.offsetHeight || 200;
  const dpr = globalThis.devicePixelRatio || 1;
  if (canvas.width !== width * dpr) canvas.width = width * dpr;
  if (canvas.height !== height * dpr) canvas.height = height * dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fillRect(0, 0, width, height);

  const left = 48;
  const right = width - 16;
  const top = 16;
  const bottom = height - 28;

  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i += 1) {
    const y = top + ((bottom - top) / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  if (history.length === 0 || metricKeys.length === 0) {
    ctx.restore();
    return;
  }

  const step = (right - left) / Math.max(history.length - 1, 1);

  metricKeys.forEach((key, index) => {
    const range = ranges[key] || { min: 0, max: 1 };
    const span = range.max - range.min || 1;
    const color = METRIC_COLORS[index % METRIC_COLORS.length];

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();

    let started = false;
    history.forEach((entry, entryIndex) => {
      const value = entry?.metrics?.[key];
      if (typeof value !== "number" || !Number.isFinite(value)) return;
      const ratio = (value - range.min) / span;
      const x = left + entryIndex * step;
      const y = bottom - ratio * (bottom - top);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });

    if (started) {
      ctx.stroke();
      const lastValue = history[history.length - 1]?.metrics?.[key];
      if (typeof lastValue === "number" && Number.isFinite(lastValue)) {
        const ratio = (lastValue - range.min) / span;
        const x = left + (history.length - 1) * step;
        const y = bottom - ratio * (bottom - top);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  ctx.restore();
}

function parseDate(input) {
  if (input === null || input === undefined) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;
}

function resolveStatusTone(status) {
  const value = (status || "").toString().toLowerCase();
  if (value.includes("nominal") || value.includes("ok") || value.includes("green")) {
    return {
      label: "Nominal",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    };
  }
  if (value.includes("warning") || value.includes("caution") || value.includes("amber") || value.includes("yellow")) {
    return {
      label: "Caution",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    };
  }
  if (value.includes("critical") || value.includes("fault") || value.includes("error") || value.includes("red")) {
    return {
      label: "Critical",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    };
  }
  return {
    label: status ? String(status) : "Unknown",
    className: "border-slate-800 bg-slate-900/60 text-slate-300",
  };
}

function resolveSeverityTone(severity) {
  const value = (severity || "").toString().toLowerCase();
  if (value.includes("critical") || value.includes("severe")) {
    return {
      label: "Critical",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    };
  }
  if (value.includes("warn") || value.includes("amber") || value.includes("caution")) {
    return {
      label: "Warning",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    };
  }
  if (value.includes("success") || value.includes("green") || value.includes("clear")) {
    return {
      label: "Clear",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    };
  }
  return {
    label: severity ? String(severity) : "Info",
    className: "border-slate-800 bg-slate-900/60 text-slate-300",
  };
}

function formatTimestamp(date) {
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatAgo(date) {
  if (!date) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 500) return "just now";
  if (diffMs < 60000) return `${Math.max(1, Math.round(diffMs / 1000))}s ago`;
  if (diffMs < 3600000) return `${Math.max(1, Math.round(diffMs / 60000))}m ago`;
  if (diffMs < 86400000) return `${Math.max(1, Math.round(diffMs / 3600000))}h ago`;
  return `${Math.max(1, Math.round(diffMs / 86400000))}d ago`;
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 1) return value.toFixed(1);
  return value.toFixed(3);
}
