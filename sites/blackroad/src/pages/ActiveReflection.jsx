import { useEffect, useState } from "react";

function createBaseline(prompts) {
  const answers = prompts.map(() => "");
  const checks = prompts.map(() => false);
  return { answers, checks, notes: "" };
}

function normalizeFromStorage(raw, prompts) {
  const fallback = createBaseline(prompts);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        ...fallback,
        answers: prompts.map((_, index) => parsed[index] ?? ""),
      };
    }

    return {
      answers: prompts.map((_, index) => parsed.answers?.[index] ?? ""),
      checks: prompts.map((_, index) => parsed.checks?.[index] ?? false),
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch (error) {
    console.warn("Failed to parse ActiveReflection storage", error);
    return fallback;
  }
}

export default function ActiveReflection({ title = "Active Reflection", prompts = [], storageKey }) {
  const [state, setState] = useState(() => {
    const fallback = createBaseline(prompts);

    if (typeof window === "undefined" || !storageKey) {
      return fallback;
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

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {storageKey ? (
          <span className="text-xs uppercase tracking-wide text-slate-400">Autosave key: {storageKey}</span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Use the checklist to confirm each experiment and capture observations in the text areas. Everything saves locally to your
        browser.
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
export default function ActiveReflection({ title, storageKey, prompts }) {
export default function ActiveReflection({ title = "Active Reflection", storageKey = "reflect", prompts = [] }) {
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) setText(saved);
      if (saved) setText(saved);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, text);
    } catch {}
  }, [text, storageKey]);
  }, [storageKey, text]);

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
      {prompts.length > 0 && (
        <ul className="mb-2 list-disc list-inside text-sm opacity-80">
          {prompts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      <textarea
        className="w-full text-sm text-black rounded p-1"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </section>
  );
}
