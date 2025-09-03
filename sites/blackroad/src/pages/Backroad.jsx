import { useEffect, useState } from 'react';

export default function Backroad() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [files, setFiles] = useState(null);
  const [logs, setLogs] = useState('');
  const [memory, setMemory] = useState(null);
  const [integrations, setIntegrations] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV || localStorage.getItem('backroad-auth') === '1') {
      setAuthed(true);
    }
  }, []);

  const login = () => {
    const key = import.meta.env.VITE_BACKROAD_KEY || 'backroad';
    if (pass === key) {
      localStorage.setItem('backroad-auth', '1');
      setAuthed(true);
    }
  };

  const refresh = () => {
    fetch('/api/backroad/files')
      .then(r => r.json())
      .then(setFiles)
      .catch(() => setFiles(null));
    fetch('/api/backroad/logs')
      .then(r => r.text())
      .then(setLogs)
      .catch(() => setLogs(''));
    fetch('/api/backroad/memory')
      .then(r => r.json())
      .then(setMemory)
      .catch(() => setMemory(null));
    fetch('/api/backroad/integrations')
      .then(r => r.json())
      .then(d => setIntegrations(Boolean(d.enabled)))
      .catch(() => {});
  };

  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    await fetch('/api/backroad/import', { method: 'POST', body: form });
    refresh();
  };

  const handleExport = async () => {
    const res = await fetch('/api/backroad/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'session.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleIntegrations = async () => {
    const next = !integrations;
    setIntegrations(next);
    await fetch('/api/backroad/integrations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    }).catch(() => {});
  };

  if (!authed) {
    return (
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Developer Access</h2>
        <input
          type="password"
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
          value={pass}
          onChange={e => setPass(e.target.value)}
          placeholder="Passphrase"
        />
        <button className="btn" onClick={login}>
          Enter
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn" onClick={refresh}>
          Refresh
        </button>
        <label className="btn cursor-pointer">
          Import
          <input type="file" accept=".zip" onChange={handleImport} className="hidden" />
        </label>
        <button className="btn" onClick={handleExport}>
          Export
        </button>
        <label className="ml-auto flex items-center gap-2">
          <input type="checkbox" checked={integrations} onChange={toggleIntegrations} />
          Enable integrations
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4 overflow-auto">
          <h3 className="font-semibold mb-2">File Tree</h3>
          <pre className="text-xs whitespace-pre-wrap">
            {files ? JSON.stringify(files, null, 2) : 'No data'}
          </pre>
        </div>
        <div className="card p-4 overflow-auto">
          <h3 className="font-semibold mb-2">Execution Logs</h3>
          <pre className="text-xs whitespace-pre-wrap">{logs || 'No logs'}</pre>
        </div>
        <div className="card p-4 overflow-auto">
          <h3 className="font-semibold mb-2">Memory State</h3>
          <pre className="text-xs whitespace-pre-wrap">
            {memory ? JSON.stringify(memory, null, 2) : 'No data'}
          </pre>
        </div>
      </div>
    </div>
  );
}

