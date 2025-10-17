'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Source = {
  id: string;
  kind: string;
  status: string;
  last_sync_at?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API ?? 'https://api.blackroad.io';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

function formatStatus(status: string) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'error':
      return 'Error';
    case 'connecting':
      return 'Connecting';
    default:
      return status;
  }
}

function statusClasses(status: string) {
  if (status === 'active') {
    return 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/40';
  }
  if (status === 'error') {
    return 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/40';
  }
  return 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/40';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [kind, setKind] = useState('source_x');
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    }),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/v1/sources`, {
        headers,
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load sources (${response.status})`);
      }
      const body = await response.json();
      setSources(Array.isArray(body) ? body : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load sources right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = useCallback(async () => {
    if (!token.trim()) {
      setError('Token is required to connect a source.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/v1/sources`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ kind, token: token.trim() }),
      });
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      setShowModal(false);
      setToken('');
      setKind('source_x');
      await load();
    } catch (err) {
      console.error(err);
      setError('We could not validate that token. Double-check and try again.');
    } finally {
      setSubmitting(false);
    }
  }, [API_URL, headers, kind, load, token]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Sources</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect external systems via API tokens. We validate tokens instantly and kick off the first sync.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowModal(true);
            setError(null);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Connect source
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 shadow">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60 text-left uppercase tracking-wide text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Kind</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Last sync</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60 text-slate-200">
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Loading sources…
                </td>
              </tr>
            )}
            {!loading && sources.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No sources connected yet.
                </td>
              </tr>
            )}
            {!loading && sources.map((source) => (
              <tr key={source.id}>
                <td className="px-4 py-4 font-medium text-white">{source.kind}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(source.status)}`}>
                    {formatStatus(source.status)}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-300">{formatDate(source.last_sync_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Connect Source</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Paste a REST API token. We store only a secure reference and trigger ingestion automatically.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-slate-400 transition hover:text-white"
                onClick={() => setShowModal(false)}
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-200">
                Kind
                <input
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                />
              </label>

              <label className="block text-sm font-medium text-slate-200">
                Token
                <input
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Paste API token"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                />
              </label>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Secrets are stored as SecureString parameters in SSM. Revoke anytime from your provider dashboard.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
              >
                {submitting ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
