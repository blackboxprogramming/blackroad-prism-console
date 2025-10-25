import React, { useState } from "react";
import templates from "./templates";

const DEFAULT_API = "/codex_prompts";

export default function QuickLaunch({ api = DEFAULT_API }) {
  const [state, setState] = useState({ busy: "", msg: "" });

  const launch = async (name) => {
    const body = templates[name];
    if (!body) return;
    setState({ busy: name, msg: "" });

    try {
      const res = await fetch(`${api}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, body, infer_agent: false })
      });
      const payload = await res.json().catch(() => ({}));
      setState({
        busy: "",
        msg: res.ok && payload?.ok ? `🚀 launched ${payload.file}` : "error"
      });
    } catch (error) {
      setState({ busy: "", msg: "error" });
    }
  };

  return (
    <div className="card">
      <h3>Quick Launch</h3>
      <ul>
        {Object.keys(templates).map((name) => {
          const preview = templates[name]
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line && !line.startsWith("prompt:"));

          return (
            <li key={name}>
              <div>
                <strong>{name}</strong>
                {preview && <div className="muted">{preview}</div>}
              </div>
              <button
                type="button"
                onClick={() => launch(name)}
                disabled={state.busy === name}
              >
                {state.busy === name ? "Launching…" : "Launch"}
              </button>
            </li>
          );
        })}
      </ul>
      {state.msg && (
        <p className="muted" aria-live="polite">
          {state.msg}
        </p>
      )}
    </div>
  );
}
