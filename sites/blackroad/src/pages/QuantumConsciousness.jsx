import { useCallback, useEffect, useMemo, useState } from "react";

const CARDS = [
  {
    title: "Reasoning",
    metaphor: "Superposition lets minds hold multiple thoughts at once for quantum parallelism.",
    color: "#FF4FD8",
    delay: 0
  },
  {
    title: "Memory",
    metaphor: "Entangled quantum RAM could bind experiences across vast memory webs.",
    color: "#0096FF",
    delay: 150
  },
  {
    title: "Symbolic Processing",
    metaphor: "Interference patterns refine symbolic chains, amplifying the meaningful paths.",
    color: "#FDBA2D",
    delay: 300
  }
];

function Card({ title, metaphor, color, delay }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all duration-700 ${
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ borderColor: color }}
    >
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm opacity-80">{metaphor}</p>
    </div>
  );
}

export default function QuantumConsciousness() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNotes = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/quantum", { cache: "no-store", signal });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const payload = await response.json();
      if (!Array.isArray(payload.topics)) {
        throw new Error("Invalid payload");
      }

      if (signal?.aborted) {
        return;
      }

      setNotes(payload.topics);
      setLastUpdated(new Date());
    } catch (err) {
      if (signal?.aborted) {
        return;
      }
      console.error("quantum-console", err);
      setNotes([]);
      setError("Unable to reach the quantum research console.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchNotes(controller.signal);
    return () => controller.abort();
  }, [fetchNotes]);

  const researchLog = useMemo(() => {
    if (error) return `⚠️ ${error}`;
    if (loading) return "Loading research notes...";
    if (!notes.length) return "No research notes available yet.";

    return notes
      .map((entry) => `${String(entry.topic).toUpperCase()}: ${entry.summary}`)
      .join("\n");
  }, [error, loading, notes]);

  const lastSynced = useMemo(() => {
    if (!lastUpdated) return "—";
    try {
      return lastUpdated.toLocaleTimeString();
    } catch {
      return lastUpdated.toISOString();
    }
  }, [lastUpdated]);

  const timestamp = useMemo(() => new Date().toISOString(), []);

  const handleRefresh = () => {
    fetchNotes();
  };

  return (
    <div className="flex min-h-screen flex-col items-center space-y-8 p-8">
      <header className="text-center">
        <h1
          className="mb-4 text-4xl font-bold"
          style={{
            background: "linear-gradient(90deg,#FF4FD8,#0096FF,#FDBA2D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Quantum × Consciousness
        </h1>
        <p className="text-sm opacity-70">
          A speculative console for tracking emergent cognitive research threads.
        </p>
      </header>

      <section className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Card key={card.title} {...card} />
        ))}
      </section>

      <section className="w-full max-w-5xl space-y-3">
        <div className="flex items-center justify-between text-sm opacity-70">
          <span>Research console</span>
          <span>Last sync: {lastSynced}</span>
        </div>
        <div className="h-56 overflow-auto rounded-md bg-black p-4 font-mono text-green-400">
          <pre>{researchLog}</pre>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className={`rounded-md border border-white/20 px-4 py-2 text-sm transition ${
              loading ? "cursor-not-allowed opacity-60" : "hover:bg-white/10"
            }`}
          >
            {loading ? "Syncing" : "Refresh"}
          </button>
        </div>
      </section>

      <footer className="text-xs opacity-60">Deployed via Codex • {timestamp}</footer>
    </div>
  );
}
