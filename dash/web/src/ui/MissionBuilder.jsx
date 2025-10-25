import React, { useState } from "react";
import templates from "./templates";

const DEFAULT_API = "/codex_prompts";

export default function MissionBuilder({ api = DEFAULT_API }) {
  const [template, setTemplate] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");

  const choose = (name) => {
    setTemplate(name);
    setBody(templates[name] || "");
    setMsg("");
  };

  const save = async () => {
    if (!body) return;
    const title = template || "custom_mission";

    try {
      const res = await fetch(`${api}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, infer_agent: false })
      });
      const payload = await res.json().catch(() => ({}));
      setMsg(res.ok && payload?.ok ? `🚀 launched ${payload.file}` : "error");
    } catch (error) {
      setMsg("error");

const templates = {
  "Symbolic Core": {
    agents: ["Lucidia"],
    prompt: `prompt: |
  Implement a modular symbolic math engine for the Prism Console.
  - Parse LaTeX, SymPy, and natural language.
  - Output JSON ASTs and real-time visualization feeds.`,
  },
  "Quantum Geometry": {
    agents: ["Helix", "Silas"],
    prompt: `prompt: |
  Extend the symbolic engine with Clifford algebra, tensor fields, and Bloch-sphere visualizations.
  - Implement Hamiltonian dynamics and SU(3) operations.`,
  },
  "Fractal Dynamics": {
    agents: ["Orion", "Anastasia"],
    prompt: `prompt: |
  Build a fractal and chaos simulator integrated with the math engine.
  - Support Lorenz and Mandelbrot sets with real-time WebGL output.`,
  },
  "Information Geometry": {
    agents: ["Silas", "Helix", "Myra"],
    prompt: `prompt: |
  Create an information-geometry toolkit for probabilistic manifolds.
  - Fisher metrics, entropy fields, and loss-surface visualizations.`,
  },
  "Language Bridge": {
    agents: ["Myra", "Cecilia"],
    prompt: `prompt: |
  Develop a math-to-language transcriber for narrative explanations.
  - Bidirectional translation between symbols and prose.`,
  },
  "Verification & Ethics": {
    agents: ["Vera", "Eon"],
    prompt: `prompt: |
  Implement formal verification for mathematical proofs and derivations.
  - Constraint solvers, policy enforcement, and bias detection.`,
  },
};

export default function MissionBuilder({ api }) {
  const [template, setTemplate] = useState("");
  const [body, setBody] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [delay, setDelay] = useState(0);
  const [msg, setMsg] = useState("");

  const choose = (name) => {
    const t = templates[name];
    setTemplate(name);
    setBody(t.prompt);
    setSelectedAgents(t.agents);
    setMsg("");
  };

  const toggleAgent = (a) => {
    setSelectedAgents((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const launch = async () => {
    if (!body || !selectedAgents.length) return;
    const title = template || "custom_mission";
    for (const agent of selectedAgents) {
      const payload = {
        title: `${title}_${agent}`,
        body: `${body}\nagent: ${agent}`,
        infer_agent: false,
      };
      const res = await fetch(api + "/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      setMsg((m) => m + `\n${agent}: ${j.ok ? "queued" : "error"}`);
      if (delay > 0) await new Promise((r) => setTimeout(r, delay * 1000));
    }
  };

  return (
    <div className="card">
      <h3>Mission Builder</h3>
      <select onChange={(e) => choose(e.target.value)} value={template}>
        <option value="">— choose a domain —</option>
        {Object.keys(templates).map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
      <button onClick={save}>Launch Mission</button>
      {msg && (
        <p className="muted" aria-live="polite">
          {msg}
        </p>
      )}

      <div className="agent-select">
        <label>Agents:</label>
        <div className="agent-list">
          {["Lucidia","Cadillac","Cecilia","Silas","Anastasia","Elias","Helix","Orion","Vera","Eon","Myra"]
            .map((a) => (
              <label key={a}>
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(a)}
                  onChange={() => toggleAgent(a)}
                />{" "}
                {a}
              </label>
            ))}
        </div>
      </div>

      <label>Delay between runs (sec):</label>
      <input
        type="number"
        min="0"
        step="5"
        value={delay}
        onChange={(e) => setDelay(parseInt(e.target.value))}
      />

      <textarea
        rows={10}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button onClick={launch}>Queue Mission</button>
      {msg && <pre className="muted">{msg}</pre>}

      <style>{`
        .agent-select { margin-top:8px; }
        .agent-list { display:flex; flex-wrap:wrap; gap:8px; }
        pre { background:#f9fafb; padding:8px; border-radius:8px; white-space:pre-wrap; }
      `}</style>
    </div>
  );
}
