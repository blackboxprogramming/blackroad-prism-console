import { useEffect, useState } from "react";

export default function ActiveReflection({ title, storageKey, prompts }) {
  const [notes, setNotes] = useState(() =>
    prompts.map((_, i) => localStorage.getItem(`${storageKey}_${i}`) || "")
  );

  useEffect(() => {
    notes.forEach((n, i) => {
      try {
        localStorage.setItem(`${storageKey}_${i}`, n);
      } catch {}
    });
  }, [notes, storageKey]);

  const update = (i, val) => {
    setNotes((ns) => {
      const copy = ns.slice();
      copy[i] = val;
      return copy;
    });
  };

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      {prompts.map((p, i) => (
        <div key={i} className="mb-3">
          <p className="text-sm mb-1">{p}</p>
          <textarea
            value={notes[i]}
            onChange={(e) => update(i, e.target.value)}
            className="w-full text-sm p-1 rounded bg-white/10 border border-white/10"
            rows={3}
          />
        </div>
      ))}
    </div>
  );
}
