import { useEffect, useState } from "react";

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
  const [log, setLog] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      const topics = ["reasoning", "memory", "symbolic"];
      const lines = [];
      for (const t of topics) {
        try {
          const r = await fetch(`/api/quantum/${t}`);
          const j = await r.json();
          lines.push(`${t.toUpperCase()}: ${j.summary}`);
        } catch {
          lines.push(`${t.toUpperCase()}: error`);
        }
      }
      if (alive) setLog(lines.join("\n"));
    })();
    return () => {
      alive = false;
    };
  }, []);
  const ts = new Date().toISOString();
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
      <section className="w-full max-w-5xl">
        <div className="bg-black text-green-400 font-mono p-4 rounded-md h-48 overflow-auto">
          <pre>{log || "Loading research notes..."}</pre>
        </div>
      </section>
      <footer className="text-xs opacity-60">Deployed via Codex • {ts}</footer>
    </div>
  );
}
