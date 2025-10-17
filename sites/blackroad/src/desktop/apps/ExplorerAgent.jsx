import { useMemo, useState } from "react";
import AgentModeToggle from "../AgentModeToggle.jsx";

const FILESYSTEM = [
  {
    path: "src/pages/Desktop.jsx",
    summary: "Prism desktop orchestrator with draggable windows.",
    snippet: `const APPS = {\n  api: { title: "API Agent", icon: "API" },\n  llm: { title: "LLM Agent", icon: "LLM" },\n};`,
  },
  {
    path: "src/desktop/Window.jsx",
    summary: "Window manager harness for the on-screen agents.",
    snippet: `export default function Window({ win, onClose, onToggleMin, onToggleMax, onUpdate, children }) {\n  if (win.minimized) return null;\n}`,
  },
  {
    path: "src/pages/Editor.jsx",
    summary: "In-browser code runner for quick scripts.",
    snippet: `const run = () => {\n  const logs = [];\n  const orig = console.log;\n};`,
  },
  {
    path: "src/pages/Terminal.jsx",
    summary: "Simulated terminal streaming operations logs.",
    snippet: `const commands = [\n  { label: "git status", output: "On branch main" },\n];`,
  },
];

export default function ExplorerAgent() {
  const [mode, setMode] = useState("manual");
  const [filter, setFilter] = useState("");
  const [selectedPath, setSelectedPath] = useState(FILESYSTEM[0].path);

  const listing = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return FILESYSTEM;
    return FILESYSTEM.filter((file) => file.path.toLowerCase().includes(term));
  }, [filter]);

  const selected = listing.find((file) => file.path === selectedPath) || listing[0] || null;

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex flex-col gap-2 border-b border-neutral-900 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Prism Explorer</p>
            <p className="text-xs text-neutral-400">
              Browse on-screen agent blueprints and drop them into a coding session.
            </p>
          </div>
          <AgentModeToggle mode={mode} onChange={setMode} />
        </div>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter files or agents…"
          className="w-full rounded border border-neutral-800 bg-neutral-900/60 px-2 py-1 text-sm text-neutral-100 focus:border-emerald-500/60 focus:outline-none"
        />
      </header>

      <div className="flex flex-1 min-h-0 divide-x divide-neutral-900">
        <aside className="w-44 overflow-auto">
          <ul className="divide-y divide-neutral-900 text-xs">
            {listing.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors ${
                    selected && selected.path === file.path
                      ? "bg-emerald-500/10 text-emerald-100"
                      : "hover:bg-neutral-900/80 text-neutral-200"
                  }`}
                >
                  <span className="font-semibold">{file.path}</span>
                  <span className="text-[11px] text-neutral-400">{file.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex-1 overflow-auto p-3">
          {selected ? (
            <div className="space-y-3">
              <header className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">{selected.path}</h3>
                  <p className="text-xs text-neutral-400">{selected.summary}</p>
                </div>
                <span className="rounded bg-neutral-900/70 px-2 py-1 text-[11px] text-neutral-300">
                  {mode === "manual" && "Preview"}
                  {mode === "copilot" && "Linked to editor"}
                  {mode === "autonomous" && "Syncing snippets"}
                </span>
              </header>
              <div className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">Code snippet</p>
                <pre className="whitespace-pre-wrap font-mono text-xs text-neutral-100">{selected.snippet}</pre>
              </div>
              <div className="rounded border border-neutral-800 bg-neutral-900/40 p-3 text-xs text-neutral-300">
                Drop into live coding by copying the snippet above or sending to the LLM agent.
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400">No files matched this filter.</p>
          )}
        </section>
      </div>
    </div>
  );
}
