import { useMemo } from 'react';

export default function EvidencePreview({ evidence }) {
  const lines = useMemo(() => {
    if (!evidence) return [];
    return evidence.split('\n');
  }, [evidence]);

  if (!evidence) {
    return (
      <div className="border border-slate-700 rounded-md p-4 bg-slate-900/60">
        <p className="text-sm text-slate-400">Run a simulation to see evidence here.</p>
      </div>
    );
  }

  return (
    <div className="border border-emerald-500/40 rounded-md p-4 bg-slate-900/80 overflow-auto max-h-96">
      <pre className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed">{lines.join('\n')}</pre>
    </div>
  );
}
