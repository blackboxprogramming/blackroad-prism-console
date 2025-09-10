import { useEffect, useState } from "react";

export default function ActiveReflection({ title = "Active Reflection", storageKey = "reflect", prompts = [] }) {
  const [notes, setNotes] = useState(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      const obj = raw ? JSON.parse(raw) : {};
      return prompts.map((_, i) => obj[i] || "");
    } catch {
      return prompts.map(() => "");
    }
  });

  useEffect(() => {
    try {
      const obj = {};
      notes.forEach((v, i) => {
        obj[i] = v;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(obj));
      }
    } catch {}
  }, [notes, storageKey]);

  const update = (i, val) => {
    const next = notes.slice();
    next[i] = val;
    setNotes(next);
  };

  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      {prompts.map((p, i) => (
        <div key={i} className="mb-2">
          <p className="text-sm mb-1">{p}</p>
          <textarea
            className="w-full p-1 rounded bg-white/5 border border-white/10"
            rows={3}
            value={notes[i] || ""}
            onChange={(e) => update(i, e.target.value)}
          />
        </div>
      ))}
    </section>
  );
}
