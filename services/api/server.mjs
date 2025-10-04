import "./telemetry.mjs";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { WebSocketServer } from "ws";
import { Server as SocketIOServer } from "socket.io";
import { createRequire } from "module";
import { context, trace } from "@opentelemetry/api";

const requestWindowMs = Number(process.env.HEALTH_RATE_WINDOW_MS ?? 60_000);
const requestTimestamps = [];

function currentTraceId() {
  const span = trace.getSpan(context.active());
  if (!span) return null;
  const { traceId } = span.spanContext();
  return traceId && traceId !== "0".repeat(32) ? traceId : null;
}

const require = createRequire(import.meta.url);

const PORT = process.env.PORT || 4000;
const app = express();
const serverStart = Date.now();
const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null;
let concurrentRequests = 0;
let peakConcurrentRequests = 0;

app.use((req, res, next) => {
  const now = Date.now();
  requestTimestamps.push(now);
  while (requestTimestamps.length && requestTimestamps[0] < now - requestWindowMs) {
    requestTimestamps.shift();
  }

  concurrentRequests += 1;
  if (concurrentRequests > peakConcurrentRequests) {
    peakConcurrentRequests = concurrentRequests;
  }

  res.on("finish", () => {
    concurrentRequests = Math.max(0, concurrentRequests - 1);
  });

  const traceId = currentTraceId();
  if (traceId) {
    res.setHeader("x-trace-id", traceId);
    req.traceId = traceId;
  }

  next();
});

app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

/**
 * Health + metadata for the BlackRoad bridge.
 * NGINX/Caddy proxies /api/* → this service (see existing configs).
 */
app.get("/api/health.json", (req, res) => {
  res.json({
    status: "ok",
    service: "blackroad-api-bridge",
    time: new Date().toISOString(),
    build: {
      sha: process.env.BUILD_SHA ?? "dev",
      timestamp: process.env.BUILD_TIMESTAMP ?? null,
    },
    uptime_ms: Date.now() - serverStart,
    rate_limit: {
      window_ms: requestWindowMs,
      recent_requests: requestTimestamps.length,
      concurrent: concurrentRequests,
      peak_concurrent: peakConcurrentRequests,
    },
    telemetry: {
      otlp_endpoint: collectorEndpoint,
    },
    trace: {
      id: req.traceId ?? currentTraceId(),
    },
    upstreams: {
      ws: "/ws",
    },
  });
});

// Simple echo for diagnostics
app.post("/api/echo", (req, res) => {
  res.json({ ok: true, received: req.body ?? null });
});

// Minimal inference endpoint
app.post("/api/mini/infer", (req, res) => {
  const { x, y } = req.body || {};
  const output = Number(x) * Number(y);
  res.json({ output });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`BlackRoad API bridge listening on :${PORT}`);
});

// Socket.IO namespaces
const io = new SocketIOServer(server, { path: "/socket.io" });
require("./modules/collab_presence.js")({ app, io });
require("./modules/github_webhook.js")({ app });
require("./modules/voice_signal.js")({ io });

/**
 * WebSocket channel (diagnostic)
 * NGINX should map /ws → this server (HTTP/1.1 Upgrade).
 */
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ hello: "blackroad", t: Date.now() }));
  socket.on("message", (msg) => {
    socket.send(JSON.stringify({ echo: msg.toString(), t: Date.now() }));
  });
});
