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
    </div>
  );
}
