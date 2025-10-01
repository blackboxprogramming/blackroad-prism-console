import { useCallback, useEffect, useMemo, useState } from "react";

function Card({ title, metaphor, color, delay }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ borderColor: color }}
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm opacity-80">{metaphor}</p>
    </div>
  );
}

export default function QuantumConsciousness() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNotes = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quantum", {
        cache: "no-store",
        signal,
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.topics)) throw new Error("Invalid payload");
      if (signal?.aborted) return;
      setNotes(data.topics);
      setLastUpdated(new Date());
    } catch (err) {
      if (signal?.aborted) return;
      console.error("quantum-console", err);
      setError("Unable to reach the quantum research console.");
      setNotes([]);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchNotes]);

  const log = useMemo(() => {
    if (error) return `⚠️ ${error}`;
    if (!notes.length) return "No research notes available yet.";
    return notes
      .map((entry) => `${String(entry.topic).toUpperCase()}: ${entry.summary}`)
      .join("\n");
  }, [error, notes]);

  const ts = new Date().toISOString();
  const lastSynced = useMemo(() => {
    if (!lastUpdated) return "—";
    try {
      return lastUpdated.toLocaleTimeString();
    } catch {
      return lastUpdated.toISOString();
    }
  }, [lastUpdated]);
  return (
    <div className="min-h-screen flex flex-col items-center p-8 space-y-8">
      <header className="text-center">
        <h1
          className="text-4xl font-bold mb-4"
          style={{
            background: "linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Quantum x Consciousness
        </h1>
      </header>
      <section className="grid md:grid-cols-3 gap-4 w-full max-w-5xl">
        <Card
          title="Reasoning"
          metaphor="Superposition lets minds hold multiple thoughts at once for quantum parallelism."
          color="#FF4FD8"
          delay={0}
        />
        <Card
          title="Memory"
          metaphor="Entangled quantum RAM could bind experiences across vast memory webs."
          color="#0096FF"
          delay={150}
        />
        <Card
          title="Symbolic Processing"
          metaphor="Interference patterns refine symbolic chains, amplifying the meaningful paths."
          color="#FDBA2D"
          delay={300}
        />
      </section>
      <section className="w-full max-w-5xl space-y-3">
        <div className="flex justify-between items-center text-sm opacity-70">
          <span>Research console</span>
          <span>Last sync: {lastSynced}</span>
        </div>
        <div className="bg-black text-green-400 font-mono p-4 rounded-md h-56 overflow-auto">
          <pre>
            {loading ? "Loading research notes..." : log}
          </pre>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={fetchNotes}
            disabled={loading}
            className={`px-4 py-2 rounded-md border border-white/20 transition ${
              loading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-white/10"
            }`}
          >
            {loading ? "Syncing" : "Refresh"}
          </button>
        </div>
      </section>
      <footer className="text-xs opacity-60">Deployed via Codex • {ts}</footer>
    </div>
  );
}
