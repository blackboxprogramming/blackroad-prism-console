import React, { useEffect, useMemo, useState } from 'react';

type AuditEvent = {
  timestamp: string;
  actor: string;
  action: string;
  status: string;
  metadata: string;
};

const fetchAuditLog = async (): Promise<AuditEvent[]> => {
  const response = await fetch('/api/audit/activity');
  if (!response.ok) {
    throw new Error('Failed to load audit log');
  }
  return response.json();
};

const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAuditLog()
      .then(setEvents)
      .catch(err => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter(event => event.action.includes(filter));
  }, [events, filter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-10 text-slate-100">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Security Audit Trail</h1>
          <p className="text-sm text-slate-500">Every authentication, access decision, and registry update is recorded here.</p>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-500">/audit</span>
      </header>

      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
        <label className="mr-4">Filter</label>
        {['all', 'token', 'secret', 'agent', 'user', 'access'].map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              filter === value
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-900/40 text-slate-500 hover:border-emerald-500/40 hover:text-emerald-200'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <p className="rounded border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest">Timestamp</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest">Actor</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest">Action</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-widest">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(event => (
              <tr key={`${event.timestamp}-${event.actor}-${event.action}`} className="border-t border-slate-800/60">
                <td className="px-4 py-2 text-slate-400">{event.timestamp}</td>
                <td className="px-4 py-2 text-slate-200">{event.actor}</td>
                <td className="px-4 py-2 text-slate-200">{event.action}</td>
                <td className="px-4 py-2 text-emerald-300">{event.status}</td>
                <td className="px-4 py-2 text-slate-400">{event.metadata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditPage;
