import { useEffect, useState } from "react";
import AgentModeToggle from "../AgentModeToggle.jsx";
import createId from "../createId.js";

export default function EchoAgent() {
  const [mode, setMode] = useState("manual");
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState(() => []);

  useEffect(() => {
    if (mode !== "autonomous") return;
    if (history.length > 0) return;
    const timer = globalThis.setTimeout?.(() => {
      appendMessage("Auto-hello from the echo agent.");
    }, 1200);
    return () => {
      if (timer && typeof globalThis.clearTimeout === "function") {
        globalThis.clearTimeout(timer);
      }
    };
  }, [mode, history.length]);

  const appendMessage = (text) => {
    const entry = { id: createId(), text, at: new Date().toLocaleTimeString() };
    setHistory((prev) => [entry, ...prev].slice(0, 16));
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    appendMessage(text);
    setDraft("");
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-900 p-3">
        <div>
          <p className="text-sm font-semibold">Echo Agent</p>
          <p className="text-xs text-neutral-400">Routes natural language into the shared activity log.</p>
        </div>
        <AgentModeToggle mode={mode} onChange={setMode} />
      </header>

      <section className="flex-1 overflow-auto p-3">
        {history.length === 0 ? (
          <p className="text-sm text-neutral-400">No transmissions yet. Start typing below.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200"
              >
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">{entry.at}</div>
                <div className="font-mono whitespace-pre-wrap">{entry.text}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t border-neutral-900 bg-neutral-950 p-3 space-y-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Dictate updates, TODOs, or scratch notes…"
          className="h-16 w-full resize-none rounded border border-neutral-800 bg-neutral-900/60 p-2 text-sm text-neutral-100 focus:border-emerald-500/60 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>
            {mode === "manual" && "Only echoes what you type."}
            {mode === "copilot" && "Suggests storing every keystroke for context."}
            {mode === "autonomous" && "Sends periodic pings to keep humans in the loop."}
          </span>
          <button
            type="button"
            onClick={submit}
            className="rounded bg-emerald-500/20 px-3 py-1 text-emerald-200 hover:bg-emerald-500/30"
          >
            Echo
          </button>
        </div>
      </footer>
    </div>
  );
}
