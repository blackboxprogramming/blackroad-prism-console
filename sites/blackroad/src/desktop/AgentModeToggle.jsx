const MODES = [
  { id: "manual", label: "Manual" },
  { id: "copilot", label: "Copilot" },
  { id: "autonomous", label: "Autonomous" },
];

export default function AgentModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded border border-neutral-700 bg-neutral-900/70 text-xs overflow-hidden">
      {MODES.map((option) => {
        const active = option.id === mode;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`${
              active
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-neutral-300 hover:bg-neutral-800"
            } px-2 py-1 transition-colors`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
