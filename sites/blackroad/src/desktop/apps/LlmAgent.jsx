import { useEffect, useRef, useState } from "react";
import AgentModeToggle from "../AgentModeToggle.jsx";
import createId from "../createId.js";

function synthesizeReply(prompt, mode) {
  const headline = mode === "autonomous" ? "Autopilot" : mode === "copilot" ? "Paired" : "Manual";
  const summary = prompt.length > 140 ? `${prompt.slice(0, 140)}…` : prompt;
  return [
    `${headline} analysis: ${summary}`,
    "```plan",
    "1. Understand the request",
    "2. Draft a concise strategy",
    "3. Generate code with guardrails",
    "```",
    "```code",
    "// Generated snippet",
    "function demo() {",
    "  return 'co-create';",
    "}",
    "```",
  ].join("\n");
}

const QUICK_PROMPTS = [
  "Draft an onboarding checklist",
  "Create a REST handler for POST /api/jobs",
  "Summarize the math agent status",
];

export default function LlmAgent() {
  const [mode, setMode] = useState("copilot");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    { id: "intro", role: "assistant", content: "LLM agent standing by for on-screen coding." },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (mode !== "autonomous" || input.trim()) return;
    if (messages.length > 1) return;
    const autoprompt = "Observe active agents and suggest coordination.";
    sendPrompt(autoprompt);
  }, [mode]);

  const sendPrompt = (prompt) => {
    const text = prompt.trim();
    if (!text) return;
    const id = createId();
    setMessages((prev) => [...prev, { id: createId(), role: "user", content: text }, { id, role: "assistant", content: "…" }]);
    setInput("");

    const delay = mode === "manual" ? 600 : 250;
    const timer = globalThis.setTimeout?.(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, content: synthesizeReply(text, mode) } : msg))
      );
    }, delay);
    return timer;
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex flex-col gap-2 border-b border-neutral-900 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">LLM Agent</p>
            <p className="text-xs text-neutral-400">
              Real-time copilot responses with structured plans and code blocks.
            </p>
          </div>
          <AgentModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendPrompt(prompt)}
              className="rounded bg-neutral-800 px-2 py-1 text-neutral-200 hover:bg-neutral-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto space-y-3 p-3">
        {messages.map((msg) => (
          <article
            key={msg.id}
            className={`rounded border px-3 py-2 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "border-emerald-700/60 bg-emerald-500/10 text-emerald-100"
                : "border-neutral-800 bg-neutral-900/60 text-neutral-200"
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">{msg.role}</p>
            <pre className="whitespace-pre-wrap font-mono text-xs text-left">{msg.content}</pre>
          </article>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendPrompt(input);
        }}
        className="border-t border-neutral-900 bg-neutral-950 p-3 space-y-2"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type instructions, paste code, or drop a spec…"
          className="h-20 w-full resize-none rounded border border-neutral-800 bg-neutral-900/60 p-2 text-sm text-neutral-100 focus:border-emerald-500/60 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>
            {mode === "manual" && "No automation — agent replies only when prompted."}
            {mode === "copilot" && "Agent drafts solutions as you type."}
            {mode === "autonomous" && "Autonomous orchestration with proactive outputs."}
          </span>
          <button
            type="submit"
            className="rounded bg-emerald-500/20 px-3 py-1 text-emerald-200 hover:bg-emerald-500/30"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
