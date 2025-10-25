interface Shortcut {
  id: string;
  label: string;
  description: string;
  command: string;
}

interface ShortcutGridProps {
  shortcuts: Shortcut[];
}

export function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{shortcut.label}</h3>
              <p className="mt-1 text-sm text-slate-400">{shortcut.description}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-brand-300">Runbook</span>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950/80 px-4 py-3 text-sm text-brand-200">
            <code>{shortcut.command}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}
