<!-- FILE: /srv/blackroad-api/modules/devices.js -->
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

module.exports = function attachDevices(ctx = {}) {
  const app = ctx.app;
  const io = ctx.io;
  if (!app || !io) throw new Error("devices: require {app, io}");

  const dbPath = ctx.dbPath || process.env.DB_PATH || "/srv/blackroad-api/blackroad.db";
  const db = ctx.db || new Database(dbPath);

  const keyFile = process.env.ORIGIN_KEY_PATH || "/srv/secrets/origin.key";
  let ORIGIN_KEY = null;
  try {
    ORIGIN_KEY = fs.readFileSync(keyFile, "utf8").trim();
  } catch {}

  db.exec(
    `CREATE TABLE IF NOT EXISTS devices_last_seen (
       device_id   TEXT PRIMARY KEY,
       role        TEXT,
       ts_unix     INTEGER,
       payload     TEXT
     );
     CREATE TABLE IF NOT EXISTS devices_commands (
       cmd_id      INTEGER PRIMARY KEY AUTOINCREMENT,
       device_id   TEXT NOT NULL,
       payload     TEXT NOT NULL,
       created_at  INTEGER NOT NULL,
       ttl_s       INTEGER NOT NULL DEFAULT 120
     );
     CREATE INDEX IF NOT EXISTS idx_commands_device_time
       ON devices_commands (device_id, created_at DESC);`
  );

  function authorized(key, daily) {
    if (ORIGIN_KEY && key === ORIGIN_KEY) return true;
    if (daily && daily.startsWith("LUCIDIA-AWAKEN-")) return true;
    return false;
  }

  function guard(req, res, next) {
    const key = req.get("X-BlackRoad-Key") || "";
    const daily = req.get("X-BlackRoad-Daily") || "";
    if (authorized(key, daily)) return next();
    res.status(401).json({ error: "unauthorized" });
  }

  function now() {
    return Math.floor(Date.now() / 1000);
  }
  function run(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        const info = db.prepare(sql).run(params);
        resolve(info);
      } catch (e) {
        reject(e);
      }
    });
  }
  function all(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        const rows = db.prepare(sql).all(params);
        resolve(rows);
      } catch (e) {
        reject(e);
      }
    });
  }
  function get(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        const row = db.prepare(sql).get(params);
        resolve(row);
      } catch (e) {
        reject(e);
      }
    });
  }

  const nsp = io.of("/devices");
  nsp.use((socket, next) => {
    const headers = socket.handshake.headers || {};
    const key = headers["x-blackroad-key"] || "";
    const daily = headers["x-blackroad-daily"] || "";
    if (authorized(key, daily)) return next();
    next(new Error("unauthorized"));
  });
  nsp.on("connection", (socket) => {
    let joined = null;
    const allowedRooms = new Set();

    function addAllowed(value) {
      if (!value) return;
      if (Array.isArray(value)) {
        for (const item of value) addAllowed(item);
        return;
      }
      const parts = String(value)
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const entry of parts) {
        allowedRooms.add(entry);
      }
    }

    const headers = socket.handshake.headers || {};
    addAllowed(headers["x-blackroad-room"]);
    addAllowed(headers["x-blackroad-rooms"]);
    addAllowed(socket.handshake.query && socket.handshake.query.room);
    addAllowed(socket.handshake.query && socket.handshake.query.rooms);
    addAllowed(socket.handshake.auth && socket.handshake.auth.room);
    addAllowed(socket.handshake.auth && socket.handshake.auth.rooms);

    const allowWildcard = () => allowedRooms.has("*");

    socket.on("register", ({ id }) => {
      if (!id) return;
      if (joined) socket.leave(joined);
      joined = String(id);
      allowedRooms.add(joined);
      socket.join(joined);
      socket.emit("registered", { id: joined });
    });
    socket.on("join", (room) => {
      if (!room) return;
      const target = String((room && room.id) || room);
      if (!target) return;
      if (!allowWildcard() && !allowedRooms.has(target)) return;
      socket.join(target);
      socket.emit("joined", { id: target });
    });
    socket.on("disconnect", () => {});
  });

  app.post("/api/devices/:id/telemetry", guard, expressJson, async (req, res) => {
    try {
      const id = String(req.params.id);
      const body = req.body || {};
      const role = String(body.role || body.kind || "unknown");
      const payload = JSON.stringify(body);
      const ts = now();
      await run(
        `INSERT INTO devices_last_seen (device_id, role, ts_unix, payload)
         VALUES (?,?,?,?)
         ON CONFLICT(device_id) DO UPDATE SET role=excluded.role, ts_unix=excluded.ts_unix, payload=excluded.payload`,
        [id, role, ts, payload]
      );
      nsp.to(id).emit("telemetry", { id, ts, role, data: body });
      res.json({ ok: true, id, ts });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/devices/:id/command", guard, expressJson, async (req, res) => {
    try {
      const id = String(req.params.id);
      const payload = req.body && Object.keys(req.body).length ? req.body : null;
      if (!payload) return res.status(400).json({ error: "missing JSON body" });
      const ttl_s = Number(payload.ttl_s || 120);
      const created_at = now();
      const info = await run(
        `INSERT INTO devices_commands (device_id, payload, created_at, ttl_s) VALUES (?,?,?,?)`,
        [id, JSON.stringify(payload), created_at, ttl_s]
      );
      const cmd_id = info.lastInsertRowid;
      nsp.to(id).emit("command", { cmd_id, device_id: id, payload, created_at, ttl_s });
      res.status(202).json({ ok: true, cmd_id, id });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/devices/:id/commands", guard, async (req, res) => {
    try {
      const id = String(req.params.id);
      const since = Number(req.query.since || 0);
      const nowSec = now();
      const rows = await all(
        `SELECT cmd_id, device_id, payload, created_at, ttl_s
         FROM devices_commands
         WHERE device_id = ?
           AND created_at >= ?
           AND (created_at + ttl_s) >= ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [id, since || nowSec - 120, nowSec]
      );
      const out = rows.map((r) => ({
        cmd_id: r.cmd_id,
        device_id: r.device_id,
        created_at: r.created_at,
        ttl_s: r.ttl_s,
        payload: safeJson(r.payload),
      }));
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/devices", guard, async (_req, res) => {
    try {
      const rows = await all(
        `SELECT device_id, role, ts_unix, payload FROM devices_last_seen ORDER BY ts_unix DESC LIMIT 200`,
        []
      );
      const out = rows.map((r) => ({
        id: r.device_id,
        role: r.role,
        ts: r.ts_unix,
        data: safeJson(r.payload),
      }));
      res.json(out);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  function safeJson(x) {
    try {
      return JSON.parse(x || "{}");
    } catch {
      return {};
    }
  }

  function expressJson(req, res, next) {
    if (req._jsonParsed) return next();
    let buf = "";
    req.on("data", (d) => (buf += d));
    req.on("end", () => {
      req._jsonParsed = true;
      if (!buf) {
        req.body = {};
        return next();
      }
      try {
        req.body = JSON.parse(buf);
      } catch {
        req.body = {};
      }
      next();
    });
  }

  console.log("[devices] backplane attached: db=%s", dbPath);
};
