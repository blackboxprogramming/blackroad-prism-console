import React, { useEffect, useMemo, useState } from 'react';

type SourceKind = 'github_pat' | 'github_app';

type RepoStatus = {
  name: string;
  lastSyncedAt: string | null;
};

type SourceRecord = {
  id: string;
  kind: SourceKind;
  status: string;
  repos: RepoStatus[];
  lastRunAt?: string | null;
  lastEnqueuedAt?: string | null;
  metadata?: Record<string, unknown>;
};

const API_BASE = '/api/prism/sources';

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toLocaleString()} (${date.toISOString()})`;
}

function dedupeRepos(raw: string): string[] {
  const parts = raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export default function PRISMSources(): JSX.Element {
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [kind, setKind] = useState<SourceKind>('github_pat');
  const [token, setToken] = useState('');
  const [repos, setRepos] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const repoList = useMemo(() => dedupeRepos(repos), [repos]);

  const loadSources = async () => {
    const res = await fetch(API_BASE);
    const json = await res.json();
    setSources(json.sources ?? []);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const connect = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!token.trim()) {
        throw new Error('Provide a GitHub token with repo:read.');
      }
      if (!repoList.length) {
        throw new Error('Add at least one repo in owner/name format.');
      }
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, token: token.trim(), repos: repoList }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || json.error || 'Failed to connect source.');
      }
      setToken('');
      setRepos('');
      setMessage('GitHub source connected. Initial ingest enqueued.');
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const resync = async (sourceId: string) => {
    setError(null);
    setMessage(null);
    const res = await fetch(`${API_BASE}/${sourceId}/resync`, { method: 'POST' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.message || json.error || 'Failed to enqueue resync.');
      return;
    }
    setMessage('Resync requested. Worker run kicked off.');
    await loadSources();
  };

  return (
    <section>
      <h2>PRISM Sources — GitHub</h2>
      <p>Connect GitHub repos via PAT to ingest issues for PRISM dashboards.</p>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            connect();
          }}
          style={{ maxWidth: 420 }}
        >
          <h3>Connect Source</h3>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Kind
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as SourceKind)}
              style={{ width: '100%', marginTop: 4 }}
            >
              <option value="github_pat">GitHub (PAT)</option>
              <option value="github_app" disabled>
                GitHub App (coming soon)
              </option>
            </select>
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Personal access token
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ghp_..."
              style={{ width: '100%', marginTop: 4 }}
              autoComplete="off"
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Repos (one per line)
            <textarea
              value={repos}
              onChange={(event) => setRepos(event.target.value)}
              rows={5}
              placeholder="owner/repo"
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Selected repos:</strong> {repoList.join(', ') || '—'}
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Connecting…' : 'Connect GitHub Source'}
          </button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          {message && <div style={{ color: 'green', marginTop: 8 }}>{message}</div>}
        </form>
        <div style={{ flex: 1 }}>
          <h3>Connected sources</h3>
          {sources.length === 0 ? (
            <p>No sources connected yet.</p>
          ) : (
            <table border={1} cellPadding={6} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Repos</th>
                  <th>Last queued</th>
                  <th>Last worker run</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td>{source.id}</td>
                    <td>{source.status}</td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        {source.repos.map((repo) => (
                          <li key={repo.name}>
                            {repo.name}
                            <small style={{ display: 'block', color: '#555' }}>
                              Last synced: {formatTimestamp(repo.lastSyncedAt)}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{formatTimestamp(source.lastEnqueuedAt)}</td>
                    <td>{formatTimestamp(source.lastRunAt)}</td>
                    <td>
                      <button onClick={() => resync(source.id)}>Resync now</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
