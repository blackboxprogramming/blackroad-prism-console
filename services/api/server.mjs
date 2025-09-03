import express from "express";
import cors from "cors";
import morgan from "morgan";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

/**
 * Health + metadata for the BlackRoad bridge.
 * NGINX/Caddy proxies /api/* → this service (see existing configs).
 */
app.get("/api/health.json", (_req, res) => {
  res.json({
    status: "ok",
    service: "blackroad-api-bridge",
    time: new Date().toISOString(),
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
