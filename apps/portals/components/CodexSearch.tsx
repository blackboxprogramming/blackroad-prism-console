import React from "react";

type Props = { value: string; onChange: (v: string) => void };
export default function CodexSearch({ value, onChange }: Props) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by title or tag…"
      className="w-full md:w-96 rounded-xl border px-3 py-2"
      aria-label="Search codex prompts"
    />
  );
}
