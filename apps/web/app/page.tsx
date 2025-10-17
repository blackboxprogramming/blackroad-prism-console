"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Suggestion {
  boxId?: string;
  title: string;
  score: number;
  rationale: string;
  tags: string[];
  enabled: boolean;
  customTitle: string;
}

interface SavedAssignment {
  id: string;
  itemText: string;
  boxTitle: string;
  rationale: string;
  score: number;
  tags: string[];
  savedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function safeRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export default function AutoBoxPage() {
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [savedAssignments, setSavedAssignments] = useState<SavedAssignment[]>([]);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const activeCount = useMemo(
    () => suggestions.filter((suggestion) => suggestion.enabled).length,
    [suggestions]
  );

  const runPreview = useCallback(async () => {
    if (!consent) {
      setError("Please grant explicit consent to classify this text.");
      return;
    }

    if (text.trim().length === 0) {
      setError("Enter text to classify.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/classify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          consent: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Classification failed");
      }

      const payload = await response.json();
      const data = payload?.data?.suggestions ?? [];
      setSuggestions(
        data.map((suggestion: Suggestion) => ({
          ...suggestion,
          enabled: true,
          customTitle: suggestion.title,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [consent, text]);

  useEffect(() => {
    if (!autoMode) {
      return;
    }

    if (!consent || text.trim().length === 0) {
      return;
    }

    const handle = setTimeout(() => {
      runPreview();
    }, 600);

    return () => clearTimeout(handle);
  }, [autoMode, consent, text, runPreview]);

  function handleToggleSuggestion(index: number) {
    setSuggestions((current) =>
      current.map((suggestion, idx) =>
        idx === index
          ? {
              ...suggestion,
              enabled: !suggestion.enabled,
            }
          : suggestion
      )
    );
  }

  function handleRenameSuggestion(index: number, value: string) {
    setSuggestions((current) =>
      current.map((suggestion, idx) =>
        idx === index
          ? {
              ...suggestion,
              customTitle: value,
            }
          : suggestion
      )
    );
  }

  function handleSave() {
    if (activeCount === 0) {
      setError("Select at least one suggestion before saving.");
      return;
    }

    const now = new Date().toISOString();
    const entries = suggestions
      .filter((suggestion) => suggestion.enabled)
      .map((suggestion) => ({
        id: safeRandomId(),
        itemText: text,
        boxTitle: suggestion.customTitle || suggestion.title,
        rationale: suggestion.rationale,
        score: suggestion.score,
        tags: suggestion.tags,
        savedAt: now,
      }));

    setSavedAssignments((current) => [...current, ...entries]);
  }

  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function handleExportJson() {
    const payload = {
      items: savedAssignments,
      exportedAt: new Date().toISOString(),
    };
    downloadBlob(JSON.stringify(payload, null, 2), "lucidia-autobox.json", "application/json");
  }

  function handleExportMarkdown() {
    const lines = savedAssignments.map((assignment) => {
      const tagLine = assignment.tags.length
        ? `tags: ${assignment.tags.join(", ")}`
        : "tags: none";
      return `### ${assignment.boxTitle}\n- saved: ${assignment.savedAt}\n- score: ${assignment.score.toFixed(2)}\n- ${tagLine}\n- rationale: ${assignment.rationale}\n\n${assignment.itemText}`;
    });

    const content = [`# Lucidia Auto-Box Export`, `Generated ${new Date().toISOString()}`, ...lines].join("\n\n");
    downloadBlob(content, "lucidia-autobox.md", "text/markdown");
  }

  function armDelete() {
    setDeleteArmed(true);
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    deleteTimeoutRef.current = setTimeout(() => {
      setDeleteArmed(false);
    }, 10000);
  }

  function handleDeleteAll() {
    if (!deleteArmed) {
      armDelete();
      return;
    }

    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    setSavedAssignments([]);
    setSuggestions([]);
    setText("");
    setDeleteArmed(false);
  }

  return (
    <main className="flex min-h-screen flex-col gap-12 px-6 py-12 md:px-16">
      <header className="max-w-4xl">
        <h1 className="text-4xl font-semibold text-slate-100">Lucidia Auto-Box</h1>
        <p className="mt-2 text-lg text-slate-300">
          Paste freeform notes, preview explainable topic suggestions, and decide
          exactly what to keep. Nothing is stored until you say so.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-200" htmlFor="autobox-input">
            Paste text to classify
          </label>
          <textarea
            id="autobox-input"
            className="min-h-[240px] w-full rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-base text-slate-100 shadow-lg focus:border-cyan-400 focus:outline-none"
            placeholder="Drop your notes here..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />

          <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-lg">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>I consent to classifying this text for the stated scope.</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(event) => setAutoMode(event.target.checked)}
              />
              <span>Enable auto-mode (suggestions will refresh after each edit).</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runPreview}
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-800/50"
            >
              {loading ? "Classifying..." : "Preview suggestions"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={activeCount === 0 || text.trim().length === 0}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800/40"
            >
              Save to Boxes
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={savedAssignments.length === 0}
              className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 shadow-lg transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={savedAssignments.length === 0}
              className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-200 shadow-lg transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
            >
              Export Markdown
            </button>
            <button
              type="button"
              onClick={handleDeleteAll}
              className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition ${
                deleteArmed
                  ? "bg-rose-600 text-slate-50"
                  : "border border-rose-400/60 text-rose-200 hover:border-rose-300"
              }`}
            >
              {deleteArmed ? "Confirm Delete (10s)" : "Delete All"}
            </button>
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-100">Suggested Boxes</h2>
          {suggestions.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-6 text-sm text-slate-300">
              Classification suggestions will appear here once you preview.
            </p>
          )}

          <ul className="flex flex-col gap-4">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.boxId ?? suggestion.title}-${index}`}
                className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <label className="flex items-start gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={suggestion.enabled}
                      onChange={() => handleToggleSuggestion(index)}
                    />
                    <span className="mt-0.5">Include</span>
                  </label>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                    Confidence {(suggestion.score * 100).toFixed(0)}%
                  </span>
                </div>

                <input
                  type="text"
                  value={suggestion.customTitle}
                  onChange={(event) => handleRenameSuggestion(index, event.target.value)}
                  className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-base text-slate-100 focus:border-cyan-400 focus:outline-none"
                />

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-300">
                  {suggestion.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-cyan-500/10 px-3 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>

                <details className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200">
                  <summary className="cursor-pointer select-none text-cyan-200">Why?</summary>
                  <p className="mt-2 text-slate-300">{suggestion.rationale}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-100">Saved Assignments</h2>
        {savedAssignments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            Nothing saved yet. Assignments you accept will show up here with an explain link.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {savedAssignments.map((assignment) => (
              <li
                key={assignment.id}
                className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-100">{assignment.boxTitle}</p>
                    <p className="text-xs text-slate-400">Saved {assignment.savedAt}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
                    {(assignment.score * 100).toFixed(0)}% match
                  </span>
                </div>
                <details className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-slate-200">
                  <summary className="cursor-pointer select-none text-cyan-200">Why?</summary>
                  <p className="mt-2 text-slate-300">{assignment.rationale}</p>
                  <p className="mt-3 text-xs text-slate-400">Original text</p>
                  <blockquote className="mt-1 border-l-2 border-cyan-400/50 pl-3 text-slate-300">
                    {assignment.itemText}
                  </blockquote>
                  <p className="mt-3 text-xs text-slate-400">
                    Tags: {assignment.tags.length ? assignment.tags.join(", ") : "none"}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
