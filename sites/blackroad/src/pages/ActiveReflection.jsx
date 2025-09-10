import { useEffect, useState } from 'react';

export default function ActiveReflection({ title, storageKey, prompts = [] }) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setNotes(saved);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, notes);
    } catch {}
  }, [storageKey, notes]);

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
      <h3 className="font-medium">{title}</h3>
      {prompts.length > 0 && (
        <ul className="list-disc pl-4 text-sm opacity-80 space-y-1">
          {prompts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      <textarea
        className="w-full p-2 rounded bg-white/5 border border-white/10"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  );
}
