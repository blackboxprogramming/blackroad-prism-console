import { useCallback, useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SERVICES = [
  "Frontend SPA",
  "API",
  "Lucidia LLM",
  "Infinity Math",
];

export default function Monitoring() {
  const [health, setHealth] = useState({});
  const [contradictions, setContradictions] = useState([]);
  const [uptime, setUptime] = useState([]);
  const [contradictionStats, setContradictionStats] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const seen = useRef(new Set());

  const updateContradictions = useCallback((list) => {
    const previous = seen.current;
    const next = new Set();
    const fresh = [];
    const mapped = list.map((c, index) => {
      const stableKey =
        c?.id ??
        c?.timestamp ??
        [c?.module ?? "unknown", c?.description ?? "", index].join("|");
      const key = String(stableKey);
      next.add(key);
      const isNew = !previous.has(key);
      if (isNew) fresh.push(c);
      return { ...c, key, isNew };
    });
    seen.current = next;
    if (fresh.length) {
      setToast(`⚠️ ${fresh.length} new contradiction${fresh.length > 1 ? "s" : ""}`);
    }
    setContradictions(mapped);
  }, []);

  useEffect(() => {
    let ws;
    let timer;

    const handleData = (data) => {
      if (data.health) setHealth(data.health);
      if (data.contradictions) updateContradictions(data.contradictions);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    };

    const poll = async () => {
      try {
        const [h, c] = await Promise.all([
          fetch("/health/summary").then((r) => r.json()),
          fetch("/contradictions").then((r) => r.json()),
        ]);
        handleData({ health: h, contradictions: c });
      } catch (e) {
        setError("Failed to load");
      }
    };

    try {
      ws = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/monitoring`
      );
      ws.onmessage = (ev) => handleData(JSON.parse(ev.data));
      ws.onerror = () => {
        ws.close();
      };
      ws.onclose = () => {
        timer = setInterval(poll, 15000);
        poll();
      };
    } catch {
      timer = setInterval(poll, 15000);
      poll();
    }

    fetch("/logs/uptime")
      .then((r) => r.json())
      .then(setUptime)
      .catch(() => {});
    fetch("/contradictions/stats")
      .then((r) => r.json())
      .then(setContradictionStats)
      .catch(() => {});

    return () => {
      if (ws) ws.close();
      if (timer) clearInterval(timer);
    };
  }, [updateContradictions]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const statusColor = {
    ok: "bg-green-500",
    fail: "bg-red-500",
    degraded: "bg-yellow-500",
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-2 right-2 bg-red-500 text-white px-3 py-2 rounded">
          {toast}
        </div>
      )}

      <h2 className="text-xl font-semibold" style={{ color: "#0096FF" }}>
        Monitoring
      </h2>

      <div className="card p-4">
        <h3 className="font-medium mb-2" style={{ color: "#FF4FD8" }}>
          Health Matrix
        </h3>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <table className="w-full text-center">
          <thead>
            <tr>
              {SERVICES.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {SERVICES.map((s) => {
                const status = health[s]?.status || health[s] || "unknown";
                const color = statusColor[status] || "bg-neutral-400";
                return (
                  <td key={s} className="py-2">
                    <span className={`inline-block w-4 h-4 rounded-full ${color}`}></span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
        <div className="text-xs mt-2">
          Last updated: {lastUpdated || "--"}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-medium mb-2" style={{ color: "#FF4FD8" }}>
          Contradiction Alerts
        </h3>
        <ul className="space-y-1">
          {contradictions.map((c) => (
            <li
              key={c.key}
              className={`flex items-center gap-1 ${
                c.isNew ? "text-red-500" : ""
              }`}
            >
              {c.isNew && <span>⚠️</span>}
              <span>
                {c.module}: {c.description} — {c.timestamp}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-medium mb-2" style={{ color: "#FF4FD8" }}>
            Uptime % (24h)
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={uptime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              {SERVICES.map((s, i) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={["#0096FF", "#FF4FD8", "#FDBA2D", "#00c853"][i]}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-4">
          <h3 className="font-medium mb-2" style={{ color: "#FF4FD8" }}>
            Contradictions per Hour
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={contradictionStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FDBA2D" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
