import React from "react";

type Props = { label: string; active?: boolean; onClick?: () => void };
export default function CodexTag({ label, active = false, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-2xl border text-sm ${active ? "bg-black text-white" : ""}`}
      aria-pressed={active}
    >
      #{label}
    </button>
  );
}
