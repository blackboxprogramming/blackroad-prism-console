import { useEffect, useState } from "react";

export default function ActiveReflection({ title, storageKey, prompts }) {
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setText(saved);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, text);
    } catch {}
  }, [text, storageKey]);

  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ul className="mb-2 list-disc list-inside text-sm opacity-80">
        {prompts.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      <textarea
        className="w-full h-32 p-2 rounded bg-white/5 border border-white/10"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </section>
  );
}
