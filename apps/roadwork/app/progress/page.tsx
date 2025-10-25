'use client';

import { ChangeEvent, useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { ToastLiveRegion } from '@/components/navigation/ToastLiveRegion';
import { useTelemetry } from '@/hooks/useTelemetry';

export default function ProgressPage() {
  const { state, exportProgress, importProgress } = useProgress();
  const [message, setMessage] = useState<string | null>(null);
  const [importJson, setImportJson] = useState('');
  const { track, flush } = useTelemetry();

  const handleImport = () => {
    try {
      importProgress(importJson);
      setMessage('Progress imported successfully.');
      track({ type: 'import_export', payload: { action: 'import' } });
      flush();
    } catch (error) {
      console.error(error);
      setMessage('Import failed. Please check the JSON.');
    }
  };

  const handleExport = () => {
    const data = exportProgress();
    navigator.clipboard.writeText(data).catch(() => {
      console.warn('Clipboard unavailable');
    });
    setMessage('Progress copied to clipboard.');
    track({ type: 'import_export', payload: { action: 'export' } });
    flush();
  };

  return (
    <ToastLiveRegion message={message}>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Progress</h1>
          <p className="text-slate-600">Export or import your local learning progress.</p>
        </header>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent attempts</h2>
          <ul className="space-y-2">
            {state.attempts.map((attempt) => (
              <li key={attempt.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium">{attempt.lessonId}</span> — {attempt.score}% on{' '}
                {new Date(attempt.createdAt).toLocaleString()}
              </li>
            ))}
            {state.attempts.length === 0 ? <li>No attempts yet.</li> : null}
          </ul>
        </section>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded bg-brand-500 px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            Copy progress JSON
          </button>
        </div>
        <section className="space-y-2">
          <label htmlFor="progress-json" className="text-sm font-semibold">
            Import JSON
          </label>
          <textarea
            id="progress-json"
            value={importJson}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setImportJson(event.target.value)}
            className="h-40 w-full rounded border border-slate-300 px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={handleImport}
            className="rounded border border-brand-500 px-4 py-2 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            Import progress
          </button>
        </section>
      </div>
    </ToastLiveRegion>
  );
}
