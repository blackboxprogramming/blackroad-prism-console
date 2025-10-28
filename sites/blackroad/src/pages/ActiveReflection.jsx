import { useEffect, useMemo, useState } from "react";

const DEFAULT_TITLE = "Active Reflection";

function createBaseline(prompts) {
  return {
    answers: prompts.map(() => ""),
    checks: prompts.map(() => false),
    notes: "",
  };
}

function normalizeFromStorage(raw, prompts) {
  const fallback = createBaseline(prompts);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    const answers = Array.isArray(parsed?.answers) ? parsed.answers : parsed;
    const checks = Array.isArray(parsed?.checks) ? parsed.checks : [];
    return {
      answers: prompts.map((_, index) => answers?.[index] ?? ""),
      checks: prompts.map((_, index) => checks?.[index] ?? false),
      notes: typeof parsed?.notes === "string" ? parsed.notes : "",
    };
  } catch (error) {
    console.warn("Failed to parse ActiveReflection storage", error);
    return fallback;
  }
}

export default function ActiveReflection({ title = DEFAULT_TITLE, prompts = [], storageKey }) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined" || !storageKey) {
      return createBaseline(prompts);
    }
    return normalizeFromStorage(localStorage.getItem(storageKey), prompts);
  });

  useEffect(() => {
    setState((previous) => {
      const baseline = createBaseline(prompts);
      return {
        answers: prompts.map((_, index) => previous.answers?.[index] ?? baseline.answers[index]),
        checks: prompts.map((_, index) => previous.checks?.[index] ?? baseline.checks[index]),
        notes: previous.notes ?? baseline.notes,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts.join("\u0001")]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to persist ActiveReflection state", error);
    }
  }, [state, storageKey]);

  const updateAnswer = (index, value) => {
    setState((previous) => {
      const answers = [...previous.answers];
      answers[index] = value;
      return { ...previous, answers };
    });
  };

  const togglePrompt = (index) => {
    setState((previous) => {
      const checks = [...previous.checks];
      checks[index] = !checks[index];
      return { ...previous, checks };
    });
  };

  const updateNotes = (value) => {
    setState((previous) => ({ ...previous, notes: value }));
  };

  const completed = useMemo(() => state.checks.filter(Boolean).length, [state.checks]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">
            {completed} of {prompts.length} prompts complete
          </p>
        </div>
        {storageKey ? (
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Autosave key: {storageKey}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Use the checklist to confirm each experiment and capture observations in the text areas. Everything
        saves locally to your browser.
      </p>

      <div className="mt-4 space-y-4">
        {prompts.map((prompt, index) => (
          <div key={prompt} className="rounded-lg border border-white/10 bg-black/30 p-3">
            <label className="flex items-start gap-2 text-sm text-slate-100">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 cursor-pointer accent-[#FF4FD8]"
                checked={state.checks[index] ?? false}
                onChange={() => togglePrompt(index)}
              />
              <span>{prompt}</span>
            </label>
            <textarea
              className="mt-3 w-full rounded-md border border-white/10 bg-white/10 p-2 text-sm text-slate-100 placeholder:text-slate-500"
              rows={3}
              value={state.answers[index] ?? ""}
              onChange={(event) => updateAnswer(index, event.target.value)}
              placeholder="What did you observe?"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <label className="text-sm font-medium text-white" htmlFor={`${storageKey || "reflection"}-notes`}>
          Notes & insights
        </label>
        <textarea
          id={`${storageKey || "reflection"}-notes`}
          className="w-full rounded-md border border-white/10 bg-white/10 p-3 text-sm text-slate-100 placeholder:text-slate-500"
          rows={5}
          value={state.notes}
          onChange={(event) => updateNotes(event.target.value)}
          placeholder="Summarize the big ideas, invariants, or questions that emerged."
        />
      </div>
    </section>
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
