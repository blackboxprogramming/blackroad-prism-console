import React, { useEffect, useState } from 'react';
import {
  gitHealth,
  gitStatus,
  gitChanges,
  gitStage,
  gitUnstage,
  gitCommit,
  gitHistory,
} from '../gitApi';

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (err) {
    return value;
  }
}

export default function GitPage() {
  const [status, setStatus] = useState(null);
  const [changes, setChanges] = useState({ staged: [], unstaged: [] });
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [subject, setSubject] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, []);

  async function refresh() {
    try {
      setError(null);
      const [healthData, statusData, changesData, historyData] = await Promise.all([
        gitHealth(),
        gitStatus(),
        gitChanges(),
        gitHistory({ limit: 10 }),
      ]);
      setHealth(healthData);
      setStatus(statusData);
      setChanges(changesData);
      setHistory(Array.isArray(historyData.history) ? historyData.history : historyData);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err.message || 'Failed to load git data';
      setError(message);
    }
  }

  async function stage(filePath) {
    setBusy(true);
    try {
      setError(null);
      await gitStage([filePath]);
      await refresh();
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to stage file';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function unstage(filePath) {
    setBusy(true);
    try {
      setError(null);
      await gitUnstage([filePath]);
      await refresh();
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to unstage file';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function doCommit() {
    if (!subject.trim()) return;
    setBusy(true);
    try {
      setError(null);
      await gitCommit({ subject: subject.trim() });
      setSubject('');
      await refresh();
    } catch (err) {
      const message = err?.response?.data?.error || err.message || 'Unable to commit changes';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <div className="text-slate-200">Loading...</div>;
  }

  return (
    <div className="text-slate-200 space-y-6">
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-700 pb-3">
        <h1 className="text-xl font-bold">Git</h1>
        {status && (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="font-mono text-slate-300">{status.branch}</span>
            {status.upstream && <span>↔ {status.upstream}</span>}
            {(status.ahead || status.behind) && (
              <span>
                {!!status.ahead && <span className="text-emerald-400">↑{status.ahead}</span>}{' '}
                {!!status.behind && <span className="text-amber-400">↓{status.behind}</span>}
              </span>
            )}
          </div>
        )}
      </header>

      {health && (
        <div className="flex items-center gap-3 text-sm">
          <span className={health.ok ? 'text-emerald-400' : 'text-red-400'}>
            {health.ok ? 'Git available' : 'Git unavailable'}
          </span>
          {health.version && <span className="text-slate-400">{health.version}</span>}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Unstaged</h2>
            <span className="text-xs text-slate-500">{changes.unstaged.length} file(s)</span>
          </div>
          {changes.unstaged.length === 0 && (
            <div className="text-sm text-slate-500">Working tree clean</div>
          )}
          <div className="space-y-2">
            {changes.unstaged.map((f) => (
              <div key={`${f.path}-unstaged`} className="flex items-center gap-2 text-sm">
                <button
                  className="badge disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => stage(f.path)}
                  disabled={busy}
                >
                  Stage
                </button>
                <span className="font-mono text-xs text-slate-400">{f.status}</span>
                <span>{f.path}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Staged</h2>
            <span className="text-xs text-slate-500">{changes.staged.length} file(s)</span>
          </div>
          {changes.staged.length === 0 && (
            <div className="text-sm text-slate-500">No staged files</div>
          )}
          <div className="space-y-2">
            {changes.staged.map((f) => (
              <div key={`${f.path}-staged`} className="flex items-center gap-2 text-sm">
                <button
                  className="badge disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => unstage(f.path)}
                  disabled={busy}
                >
                  Unstage
                </button>
                <span className="font-mono text-xs text-slate-400">{f.status}</span>
                <span>{f.path}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
        <h2 className="mb-3 font-semibold">Commit</h2>
        <input
          className="input mb-3 w-full"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Commit subject"
        />
        <button
          className="badge disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={doCommit}
          disabled={busy || changes.staged.length === 0 || !subject.trim()}
        >
          Commit
        </button>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Recent commits</h2>
        {history.length === 0 && (
          <div className="text-sm text-slate-500">No commit history yet.</div>
        )}
        <ul className="space-y-2">
          {history.map((item) => (
            <li
              key={item.hash}
              className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-slate-400">{item.hash.slice(0, 8)}</span>
                <span className="font-medium text-slate-100">{item.subject}</span>
                <span className="text-xs text-slate-500">{item.author}</span>
                <span className="text-xs text-slate-500">{formatTimestamp(item.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
