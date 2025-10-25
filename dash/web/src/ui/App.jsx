import React from "react";
import QuickLaunch from "./QuickLaunch";
import MissionBuilder from "./MissionBuilder";

const DEFAULT_API = "/codex_prompts";
const API = globalThis?.MISSION_BUILDER_API ?? DEFAULT_API;

export default function App() {
  return (
    <main>
      <section className="grid">
        <QuickLaunch api={API} />
        <MissionBuilder api={API} />
      </section>
    </main>
import React, { useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5055";

function useNexus() {
  const [state, setState] = useState({
    latest: [],
    weights: {},
    feedback: {},
    graph_exists: false,
  });
  const wsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        const [logsRes, weightsRes, feedbackRes, graphRes] = await Promise.all([
          fetch(`${API}/logs`).then((res) => res.json()).catch(() => ({ items: [] })),
          fetch(`${API}/weights`).then((res) => res.json()).catch(() => ({ weights: {} })),
          fetch(`${API}/feedback`).then((res) => res.json()).catch(() => ({ agent_scores: {} })),
          fetch(`${API}/graph.png`, { method: "GET", cache: "no-store" })
            .then((res) => ({ ok: res.ok, status: res.status }))
            .catch(() => ({ ok: false })),
        ]);

        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            latest: logsRes.items || [],
            weights: weightsRes || {},
            feedback: feedbackRes || {},
            graph_exists: graphRes.ok || graphRes.status === 200,
          }));
        }
      } catch (err) {
        console.warn("failed to load initial nexus data", err);
      }
    };

    loadInitial();

    const wsUrl = API.replace("http", "ws") + "/ws";
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        setState((prev) => ({ ...prev, ...payload }));
      } catch (err) {
        console.error("failed to parse websocket message", err);
      }
    };
    wsRef.current.onerror = (err) => {
      console.warn("websocket error", err);
    };
    wsRef.current.onclose = () => {
      wsRef.current = null;
    };
    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return state;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const options = { month: "long", day: "numeric" };
    const date = now.toLocaleDateString(undefined, options);
    const time = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return { date, time };
  }, [now]);
}

function Sidebar({ latestAgent }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">BlackRoad.io</div>
      <nav className="sidebar__nav">
        <div className="sidebar__section">Workspace</div>
        <button className="sidebar__link sidebar__link--active">Dashboard</button>
        <button className="sidebar__link">Projects</button>
        <button className="sidebar__link">Prompts</button>
        <button className="sidebar__link">Agents</button>
        <button className="sidebar__link">Streams</button>
        <button className="sidebar__link">Datasets</button>
        <div className="sidebar__section">Ops</div>
        <button className="sidebar__link">Router</button>
        <button className="sidebar__link">Watchdog</button>
        <button className="sidebar__link">Memory</button>
      </nav>
      <div className="sidebar__cta">
        <span className="sidebar__cta-label">Start</span>
        <span className="sidebar__cta-title">Co-Coding</span>
      </div>
      <div className="sidebar__status">
        <div className="sidebar__status-title">Last Agent</div>
        <div className="sidebar__status-body">{latestAgent || "pending"}</div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { date, time } = useClock();
  return (
    <header className="topbar">
      <div className="topbar__title">Codex Nexus Control</div>
      <div className="topbar__meta">
        <span>{date}</span>
        <span>{time}</span>
      </div>
    </header>
  );
}

function Tabs() {
  return (
    <div className="tabs">
      <button className="tabs__item tabs__item--active">Timeline</button>
      <button className="tabs__item">Tasks</button>
      <button className="tabs__item">Control</button>
      <button className="tabs__item">Memory</button>
      <button className="tabs__item">Reports</button>
      <button className="tabs__item">Stack</button>
    </div>
  );
}

function TimelineCard({ items }) {
  return (
    <div className="panel panel--tall">
      <div className="panel__header">
        <div>
          <h2>Mission Timeline</h2>
          <p>Live prompt streams routed through the Codex mesh.</p>
        </div>
        <span className="panel__badge">Live</span>
      </div>
      <div className="timeline">
        {items.length === 0 && <div className="timeline__empty">Waiting for runs…</div>}
        {items.map((item, idx) => (
          <div key={`${item._file}-${idx}`} className="timeline__row">
            <div className="timeline__marker" />
            <div className="timeline__body">
              <div className="timeline__meta">
                <span className="timeline__agent">{item.agent || "Unknown Agent"}</span>
                <span className="timeline__file">{item._file}</span>
              </div>
              <div className="timeline__prompt">{(item.prompt || "").slice(0, 140) || "prompt unavailable"}</div>
              <div className="timeline__output">{(item.output || "").slice(0, 160) || "no output captured"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentStack({ weights, feedback }) {
  const data = (weights && weights.weights) || {};
  const scores = feedback.agent_scores || {};
  const entries = Object.keys({ ...data, ...scores }).map((agent) => ({
    agent,
    weight: data[agent] ?? 0,
    score: scores[agent] ?? 0,
  }));
  const sorted = entries.sort((a, b) => (b.weight || 0) - (a.weight || 0));

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Agent Stack</h2>
        <p>Router weights blended with reinforcement scores.</p>
      </div>
      <ul className="stack">
        {sorted.length === 0 && <li className="stack__empty">No agent telemetry yet.</li>}
        {sorted.map(({ agent, weight, score }) => (
          <li key={agent} className="stack__row">
            <div className="stack__info">
              <span className="stack__agent">{agent}</span>
              <span className="stack__score">score {score.toFixed(3)}</span>
            </div>
            <div className="stack__bar">
              <span style={{ width: `${Math.max(4, Math.min(100, weight * 100))}%` }} />
            </div>
            <div className="stack__weight">{(weight * 100).toFixed(1)}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MissionLog({ items }) {
  const top = items.slice(0, 4);
  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Mixed Signal Revocations</h2>
        <p>Snapshot of the latest Codex log commits.</p>
      </div>
      <div className="mission-log">
        {top.length === 0 && <div className="mission-log__empty">Telemetry quiet.</div>}
        {top.map((item, idx) => (
          <div key={`${item._file}-${idx}`} className="mission-log__row">
            <div className="mission-log__title">{item.prompt?.slice(0, 60) || "Untitled prompt"}</div>
            <div className="mission-log__meta">
              <span>{item.agent || "unknown"}</span>
              <span>{item._file}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLaunch() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setMsg("Title is required.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, infer_agent: true }),
      });
      const j = await res.json();
      if (j.ok) {
        setMsg(`Saved ${j.file}`);
        setTitle("");
        setBody("");
      } else {
        setMsg(j.error || "Failed to save prompt.");
      }
    } catch (err) {
      setMsg("Request failed. Is the API running?");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Prompt Launch</h2>
        <p>Draft a new Codex mission and push it into the router.</p>
      </div>
      <div className="launch">
        <input
          placeholder="Title (file name)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Write YAML prompt or plain text…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
        />
        <button onClick={submit} disabled={isSaving}>
          {isSaving ? "Saving…" : "Launch Prompt"}
        </button>
        {msg && <p className="launch__msg">{msg}</p>}
      </div>
    </div>
  );
}

function MemoryPreview({ graphExists }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Memory Graph</h2>
        <p>Lucidia math-lab projections rendered by the watchdog.</p>
      </div>
      <div className="memory">
        {graphExists ? (
          <img src={`${API}/graph.png`} alt="graph" />
        ) : (
          <div className="memory__empty">No graph yet.</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { latest = [], weights = {}, feedback = {}, graph_exists = false } = useNexus();
  const latestAgent = latest[0]?.agent;

  return (
    <div className="app">
      <Sidebar latestAgent={latestAgent} />
      <div className="workspace">
        <Topbar />
        <Tabs />
        <div className="layout">
          <div className="layout__main">
            <TimelineCard items={latest} />
          </div>
          <div className="layout__side">
            <AgentStack weights={weights} feedback={feedback} />
            <MissionLog items={latest} />
          </div>
        </div>
        <div className="layout layout--secondary">
          <div className="layout__main">
            <QuickLaunch />
          </div>
          <div className="layout__side">
            <MemoryPreview graphExists={graph_exists} />
          </div>
        </div>
      </div>
      <style>{`
        :root {
          font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont;
          color-scheme: dark;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #050b2c; color: #e3e7ff; }
        .app {
          min-height: 100vh;
          display: flex;
          background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.12), transparent 55%),
            radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.14), transparent 60%),
            #050b2c;
        }
        .sidebar {
          width: 230px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: rgba(3, 7, 25, 0.9);
          border-right: 1px solid rgba(79, 70, 229, 0.25);
          backdrop-filter: blur(12px);
        }
        .sidebar__brand {
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sidebar__nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar__section {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #7b82ff;
          margin-top: 8px;
        }
        .sidebar__link {
          background: transparent;
          border: none;
          color: #cdd2ff;
          text-align: left;
          padding: 6px 0;
          font-size: 14px;
          cursor: pointer;
        }
        .sidebar__link--active {
          color: #ffffff;
          font-weight: 600;
        }
        .sidebar__cta {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 18px 16px;
          border-radius: 12px;
          background: linear-gradient(130deg, #f97316, #facc15);
          color: #111827;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .sidebar__cta-label { font-size: 12px; }
        .sidebar__cta-title { font-size: 16px; }
        .sidebar__status {
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.12);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar__status-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(148, 163, 184, 0.9);
        }
        .sidebar__status-body {
          font-size: 16px;
          font-weight: 600;
        }

        .workspace {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 32px 40px;
          gap: 24px;
        }
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .topbar__title {
          font-size: 22px;
          font-weight: 600;
        }
        .topbar__meta {
          display: flex;
          gap: 12px;
          font-size: 14px;
          color: rgba(226, 232, 255, 0.7);
        }
        .tabs {
          display: flex;
          gap: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.3);
        }
        .tabs__item {
          background: transparent;
          border: none;
          color: rgba(199, 210, 254, 0.6);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 14px;
          cursor: pointer;
        }
        .tabs__item--active {
          background: rgba(79, 70, 229, 0.35);
          color: #ffffff;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 24px;
        }
        .layout--secondary {
          grid-template-columns: minmax(0, 1fr) 340px;
        }
        .layout__main,
        .layout__side {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel {
          background: rgba(8, 15, 48, 0.78);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 25px 45px -35px rgba(15, 23, 42, 0.8);
        }
        .panel--tall {
          min-height: 420px;
        }
        .panel__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .panel__header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .panel__header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: rgba(191, 219, 254, 0.65);
        }
        .panel__badge {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(236, 72, 153, 0.28);
          color: #f472b6;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
          padding-left: 20px;
        }
        .timeline::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, rgba(99, 102, 241, 0.4), transparent 90%);
        }
        .timeline__row {
          display: flex;
          gap: 16px;
        }
        .timeline__marker {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: radial-gradient(circle, #34d399, #059669);
          margin-top: 4px;
        }
        .timeline__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .timeline__meta {
          display: flex;
          gap: 12px;
          font-size: 13px;
          color: rgba(226, 232, 255, 0.65);
        }
        .timeline__agent {
          font-weight: 600;
          color: #a5b4fc;
        }
        .timeline__file {
          font-family: "JetBrains Mono", ui-monospace, SFMono-Regular;
          font-size: 12px;
          color: rgba(148, 163, 184, 0.7);
        }
        .timeline__prompt {
          font-size: 14px;
          color: rgba(243, 244, 255, 0.9);
        }
        .timeline__output {
          font-size: 13px;
          color: rgba(148, 163, 184, 0.85);
        }
        .timeline__empty {
          padding: 60px 0;
          text-align: center;
          color: rgba(148, 163, 184, 0.7);
        }

        .stack {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .stack__row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 1fr auto;
          gap: 14px;
          align-items: center;
        }
        .stack__info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stack__agent { font-weight: 600; }
        .stack__score { font-size: 12px; color: rgba(148, 163, 184, 0.8); }
        .stack__bar {
          height: 8px;
          background: rgba(99, 102, 241, 0.16);
          border-radius: 999px;
          overflow: hidden;
        }
        .stack__bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
        }
        .stack__weight {
          font-size: 12px;
          color: rgba(191, 219, 254, 0.75);
        }
        .stack__empty {
          color: rgba(148, 163, 184, 0.7);
        }

        .mission-log {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .mission-log__row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(79, 70, 229, 0.12);
        }
        .mission-log__row:last-child {
          border-bottom: none;
        }
        .mission-log__title {
          font-size: 14px;
          color: rgba(248, 250, 255, 0.95);
        }
        .mission-log__meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(148, 163, 184, 0.75);
        }
        .mission-log__empty {
          text-align: center;
          color: rgba(148, 163, 184, 0.7);
        }

        .launch {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .launch input,
        .launch textarea {
          background: rgba(12, 21, 55, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 12px;
          padding: 12px;
          color: #e0e7ff;
          font-family: inherit;
          font-size: 14px;
        }
        .launch textarea {
          resize: vertical;
          min-height: 140px;
        }
        .launch button {
          align-self: flex-start;
          padding: 10px 24px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(120deg, #6366f1, #22d3ee);
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
        }
        .launch button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .launch__msg {
          font-size: 12px;
          color: rgba(148, 163, 184, 0.85);
        }

        .memory {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 220px;
          background: rgba(12, 21, 55, 0.65);
          border-radius: 14px;
          border: 1px dashed rgba(99, 102, 241, 0.25);
          overflow: hidden;
        }
        .memory img {
          width: 100%;
          max-height: 280px;
          object-fit: contain;
        }
        .memory__empty {
          color: rgba(148, 163, 184, 0.7);
        }

        @media (max-width: 1200px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .layout--secondary {
            grid-template-columns: 1fr;
          }
          .layout__side {
            flex-direction: column;
          }
        }

        @media (max-width: 900px) {
          .sidebar {
            display: none;
          }
          .workspace {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
