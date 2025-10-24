import { useState } from "react";

export default function ChatPanel({ jobId, events }) {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState([]);

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes((prev) => [...prev, { id: `note-${prev.length}`, text: draft, ts: new Date().toISOString() }]);
    setDraft("");
  };

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Chat Panel</h2>
        <span className="text-[10px] uppercase opacity-50">job {jobId ?? "idle"}</span>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto rounded bg-black/30 p-3 text-xs">
        {(events ?? []).map((event) => (
          <div key={event.id} className="flex items-start gap-2">
            <span>{event.emoji}</span>
            <div>
              <div className="font-semibold">{event.text}</div>
              <div className="text-[10px] opacity-50">{new Date(event.ts).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {notes.map((note) => (
          <div key={note.id} className="flex items-start gap-2">
            <span>💬</span>
            <div>
              <div className="font-semibold">{note.text}</div>
              <div className="text-[10px] opacity-50">{new Date(note.ts).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded bg-black/40 px-2 py-1 text-xs"
          placeholder="Add a note for this job"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="rounded bg-blue-500/30 px-3 py-1 text-xs hover:bg-blue-500/40" onClick={addNote}>
          Save
        </button>
      </div>
    </section>
  );
}
