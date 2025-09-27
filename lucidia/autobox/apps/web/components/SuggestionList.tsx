"use client";

import { useState } from "react";

export interface EditableSuggestion {
  id: string;
  boxTitle: string;
  rationale: string;
  tags: string[];
  score: number;
  minimalFeatures: string[];
  enabled: boolean;
}

interface SuggestionListProps {
  suggestions: EditableSuggestion[];
  onToggle: (id: string, enabled: boolean) => void;
  onTitleChange: (id: string, title: string) => void;
}

export function SuggestionList({
  suggestions,
  onToggle,
  onTitleChange,
}: SuggestionListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (suggestions.length === 0) {
    return (
      <p className="muted">No suggestions yet. Paste notes above and request a preview.</p>
    );
  }

  return (
    <ul className="suggestion-list">
      {suggestions.map((suggestion) => {
        const isExpanded = expanded[suggestion.id] ?? false;
        return (
          <li key={suggestion.id} className="suggestion-card">
            <div className="suggestion-header">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={suggestion.enabled}
                  onChange={(event) => onToggle(suggestion.id, event.target.checked)}
                />
                Enable
              </label>
              <span>Confidence: {(suggestion.score * 100).toFixed(0)}%</span>
            </div>
            <div className="suggestion-body">
              <input
                className="suggestion-title"
                value={suggestion.boxTitle}
                onChange={(event) => onTitleChange(suggestion.id, event.target.value)}
                aria-label="Box title"
              />
              <div className="tag-row">
                {suggestion.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="link-button"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [suggestion.id]: !isExpanded,
                  }))
                }
              >
                {isExpanded ? "Hide why" : "Why?"}
              </button>
              {isExpanded ? (
                <div className="explain-panel">
                  <p>{suggestion.rationale}</p>
                  <p className="muted" style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                    Minimal features: {suggestion.minimalFeatures.join(", ") || "n/a"}
                  </p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
