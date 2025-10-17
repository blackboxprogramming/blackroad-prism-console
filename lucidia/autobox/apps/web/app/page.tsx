"use client";

import { useEffect, useMemo, useState } from "react";
import type { Assignment, Box, Identity, Item } from "@lucidia/core";
import { exportToJson, exportToMarkdown } from "@lucidia/core";
import { SuggestionList, type EditableSuggestion } from "@/components/SuggestionList";
import { requestPreview, type ClassificationPreview } from "@/lib/api";

interface SavedState {
  boxes: Box[];
  assignments: Assignment[];
  items: Item[];
}

const identity: Identity = {
  id: "demo-user",
  publicKey: "demo-public-key",
  settings: {},
};

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [rawText, setRawText] = useState("");
  const [seed, setSeed] = useState("lucidia");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ClassificationPreview | null>(null);
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>([]);
  const [saved, setSaved] = useState<SavedState>({ boxes: [], assignments: [], items: [] });
  const [deleteCountdown, setDeleteCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (deleteCountdown === null || deleteCountdown <= 0) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setDeleteCountdown((current) => (current !== null ? current - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [deleteCountdown]);

  const savedExplainers = useMemo(() => {
    if (!preview) return new Map<string, ClassificationPreview["explainability"][number]>();
    return new Map(
      preview.explainability.map((record) => [record.suggestion.rationale, record] as const)
    );
  }, [preview]);

  const handlePreview = async () => {
    if (!consentGiven) {
      setError("Consent is required before requesting a preview.");
      return;
    }
    if (!rawText.trim()) {
      setError("Paste some text to classify.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestPreview({
        text: rawText,
        seed,
        consentToken: `consent-${identity.id}`,
      });
      setPreview(result);
      setSuggestions(
        result.preview.suggestions.map((suggestion) => ({
          id: `${suggestion.boxTitle}${suggestion.rationale}`,
          boxTitle: suggestion.boxTitle,
          rationale: suggestion.rationale,
          tags: suggestion.tags,
          score: suggestion.score,
          minimalFeatures:
            result.explainability.find(
              (record) =>
                record.suggestion.boxTitle === suggestion.boxTitle &&
                record.suggestion.rationale === suggestion.rationale
            )?.minimalFeatures ?? [],
          enabled: true,
        }))
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to request preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!preview || suggestions.every((suggestion) => !suggestion.enabled)) {
      return;
    }
    const itemId = crypto.randomUUID();
    const timestamp = new Date();
    const enabled = suggestions.filter((suggestion) => suggestion.enabled);
    const boxes: Box[] = enabled.map((suggestion) => ({
      id: crypto.randomUUID(),
      ownerId: identity.id,
      title: suggestion.boxTitle,
      description: suggestion.rationale,
      createdAt: timestamp,
    }));
    const assignments: Assignment[] = enabled.map((suggestion, index) => ({
      id: crypto.randomUUID(),
      itemId,
      boxId: boxes[index].id,
      score: suggestion.score,
      rationale: suggestion.rationale,
      createdAt: timestamp,
    }));
    const item: Item = {
      id: itemId,
      ownerId: identity.id,
      rawText,
      createdAt: timestamp,
    };

    setSaved((current) => ({
      boxes: [...current.boxes, ...boxes],
      assignments: [...current.assignments, ...assignments],
      items: [...current.items, item],
    }));
  };

  const handleExportJson = () => {
    if (saved.assignments.length === 0) return;
    const json = exportToJson({
      identity,
      boxes: saved.boxes,
      assignments: saved.assignments,
      items: saved.items,
    });
    download("lucidia-autobox-export.json", json, "application/json");
  };

  const handleExportMarkdown = () => {
    if (saved.assignments.length === 0) return;
    const markdown = exportToMarkdown({
      identity,
      boxes: saved.boxes,
      assignments: saved.assignments,
      items: saved.items,
    });
    download("lucidia-autobox-export.md", markdown, "text/markdown");
  };

  const handleDelete = () => {
    if (saved.assignments.length === 0) return;
    if (deleteCountdown === null) {
      setDeleteCountdown(10);
      return;
    }
    if (deleteCountdown > 0) {
      return;
    }
    setSaved({ boxes: [], assignments: [], items: [] });
    setDeleteCountdown(null);
  };

  const cancelDelete = () => {
    setDeleteCountdown(null);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="title-main">Auto-Box Preview</h1>
        <p className="muted">
          Lucidia keeps your words yours. Paste notes, opt-in to processing, and inspect every suggestion before saving.
        </p>
      </header>

      <section className="section stack">
        <label className="label" htmlFor="notes">
          Paste your notes
        </label>
        <textarea
          id="notes"
          className="textarea"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Drop meeting scribbles or research fragments here..."
        />
        <div className="row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(event) => setConsentGiven(event.target.checked)}
            />
            I consent to one-time processing of this text
          </label>
          <label className="row" style={{ gap: "8px" }}>
            <span className="hint">Seed</span>
            <input
              className="input-inline"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              aria-label="Deterministic seed"
            />
          </label>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={handlePreview}
          disabled={isLoading || !consentGiven || !rawText.trim()}
        >
          {isLoading ? "Generating preview…" : "Preview assignments"}
        </button>
        {error ? (
          <p className="hint" style={{ color: "var(--red-300)" }}>
            {error}
          </p>
        ) : null}
      </section>

      <section className="section stack">
        <h2 className="section-title">Suggested boxes</h2>
        <SuggestionList
          suggestions={suggestions}
          onToggle={(id, enabled) =>
            setSuggestions((current) =>
              current.map((suggestion) =>
                suggestion.id === id ? { ...suggestion, enabled } : suggestion
              )
            )
          }
          onTitleChange={(id, title) =>
            setSuggestions((current) =>
              current.map((suggestion) =>
                suggestion.id === id ? { ...suggestion, boxTitle: title } : suggestion
              )
            )
          }
        />
        <button
          type="button"
          className="button-secondary"
          onClick={handleSave}
          disabled={suggestions.every((suggestion) => !suggestion.enabled)}
        >
          Save selected boxes
        </button>
      </section>

      <section className="section stack">
        <h2 className="section-title">Saved preview</h2>
        {saved.assignments.length === 0 ? (
          <p className="muted">
            Nothing saved yet. Saved boxes will appear here with explain links ready for auditing.
          </p>
        ) : (
          <ul className="saved-list">
            {saved.assignments.map((assignment) => {
              const box = saved.boxes.find((candidate) => candidate.id === assignment.boxId);
              return (
                <li key={assignment.id} className="saved-card">
                  <div className="saved-card-header">
                    <span className="saved-title">{box?.title ?? "Box"}</span>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        const record = savedExplainers.get(assignment.rationale);
                        if (record) {
                          alert(
                            `${record.suggestion.rationale}\n\nMinimal features: ${record.minimalFeatures.join(", ")}`
                          );
                        }
                      }}
                    >
                      Why?
                    </button>
                  </div>
                  <p className="hint">Score: {(assignment.score * 100).toFixed(0)}%</p>
                </li>
              );
            })}
          </ul>
        )}
        <div className="actions-row">
          <button
            type="button"
            className="button-outline"
            onClick={handleExportJson}
            disabled={saved.assignments.length === 0}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="button-outline"
            onClick={handleExportMarkdown}
            disabled={saved.assignments.length === 0}
          >
            Export Markdown
          </button>
          <button
            type="button"
            className="button-outline-danger"
            onClick={handleDelete}
            disabled={saved.assignments.length === 0}
          >
            {deleteCountdown === null
              ? "Delete all (10s hold)"
              : deleteCountdown > 0
              ? `Confirming… ${deleteCountdown}s`
              : "Click to wipe everything"}
          </button>
          {deleteCountdown !== null ? (
            <button type="button" className="button-outline" onClick={cancelDelete}>
              Cancel
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
