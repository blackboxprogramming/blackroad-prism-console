"use client";
import { useState } from "react";

type Mode = "machine" | "chit-chat";
interface Item { role: "user" | "assistant"; content: string; }

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("machine");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const out = [...items, { role: "user", content: input }];
    setItems(out);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: out, mode }),
      });
      const data = await res.json();
      setItems([...out, { role: "assistant", content: data?.content ?? JSON.stringify(data) }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">BlackRoad × Lucidia — Local Chat</h1>
        <select className="border rounded px-2 py-1" value={mode} onChange={(e) => setMode(e.target.value as Mode)} disabled={busy}>
          <option value="machine">machine</option>
          <option value="chit-chat">chit-chat</option>
        </select>
      </div>
      <div className="border rounded p-3 h-[55vh] overflow-auto text-sm space-y-3 bg-white">
        {items.map((m, i) => (
          <div key={i}>
            <span className="font-semibold">{m.role}:</span>{" "}
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-neutral-500">
            Try: <code>files.search RoadCoin</code> or say <em>chit chat cadillac</em>.
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type here…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" ? send() : null}
          disabled={busy}
        />
        <button className="border rounded px-4 py-2" onClick={send} disabled={busy}>Send</button>
      </div>
    </div>
  );
}
