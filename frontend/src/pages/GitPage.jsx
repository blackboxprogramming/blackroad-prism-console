import React, { useEffect, useState } from 'react';
import { gitStatus, gitChanges, gitStage, gitUnstage, gitCommit } from '../gitApi';

export default function GitPage() {
  const [status, setStatus] = useState(null);
  const [changes, setChanges] = useState({ staged: [], unstaged: [] });
  const [subject, setSubject] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const s = await gitStatus();
    setStatus(s);
    const c = await gitChanges();
    setChanges(c);
  }

  async function stage(path) {
    await gitStage([path]);
    refresh();
  }

  async function unstage(path) {
    await gitUnstage([path]);
    refresh();
  }

  async function doCommit() {
    await gitCommit({ subject });
    setSubject('');
    refresh();
  }

  if (!status) return <div className="text-slate-200">Loading...</div>;

  return (
    <div className="text-slate-200 space-y-4">
      <header className="flex items-center gap-4 border-b border-slate-700 pb-2">
        <h1 className="text-xl font-bold">Git</h1>
        <span className="text-sm text-slate-400">{status.branch}</span>
      </header>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Unstaged</h2>
          {changes.unstaged.length === 0 && (
            <div className="text-sm text-slate-500">Working tree clean</div>
          )}
          {changes.unstaged.map((f) => (
            <div key={f.path} className="flex items-center gap-2 text-sm mb-1">
              <button className="badge" onClick={() => stage(f.path)}>
                Stage
              </button>
              <span>{f.path}</span>
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Staged</h2>
          {changes.staged.length === 0 && (
            <div className="text-sm text-slate-500">No staged files</div>
          )}
          {changes.staged.map((f) => (
            <div key={f.path} className="flex items-center gap-2 text-sm mb-1">
              <button className="badge" onClick={() => unstage(f.path)}>
                Unstage
              </button>
              <span>{f.path}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <input
          className="input w-full mb-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Commit subject"
        />
        <button
          className="badge"
          onClick={doCommit}
          disabled={changes.staged.length === 0 || !subject.trim()}
        >
          Commit
        </button>
      </div>
    </div>
  );
}
