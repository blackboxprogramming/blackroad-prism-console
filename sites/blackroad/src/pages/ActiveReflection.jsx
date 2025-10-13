import { useEffect, useState } from "react";

export default function ActiveReflection({ title, storageKey, prompts }) {
  const [answers, setAnswers] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem(storageKey)) || prompts.map(() => "");
      } catch {
        return prompts.map(() => "");
      }
    }
    return prompts.map(() => "");
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    }
  }, [answers, storageKey]);

  const update = (i, val) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };
export default function ActiveReflection({ title = "Active Reflection", prompts = [], storageKey }) {
  const [checks, setChecks] = useState(prompts.map(() => false));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { checks: c, notes: n } = JSON.parse(raw);
        if (Array.isArray(c)) setChecks(c);
        if (typeof n === "string") setNotes(n);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ checks, notes }));
    } catch {}
  }, [storageKey, checks, notes]);

  const toggle = (i) => setChecks((cs) => cs.map((v, k) => (k === i ? !v : v)));

  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      {prompts.map((p, i) => (
        <div key={i} className="mb-2">
          <p className="text-sm opacity-80">{p}</p>
          <textarea
            className="mt-1 w-full text-sm p-1 rounded bg-white/5 border border-white/10"
            rows={3}
            value={answers[i] || ""}
            onChange={(e) => update(i, e.target.value)}
          />
        </div>
      ))}
      <ul className="text-sm space-y-1">
        {prompts.map((p, i) => (
          <li key={i} className="flex items-start gap-2">
            <input type="checkbox" checked={checks[i]} onChange={() => toggle(i)} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <label className="text-sm opacity-80 block mt-3">Notes / insights</label>
      <textarea
        className="w-full p-2 rounded bg-white/10 border border-white/10"
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write what changed when you moved each slider. What surprised you? What stayed invariant?"
      />
      <p className="text-xs opacity-70 mt-2">
        Tip: your reflections auto-save locally{storageKey ? ` (key: ${storageKey})` : ""}.
      </p>
    </section>
  );
}
