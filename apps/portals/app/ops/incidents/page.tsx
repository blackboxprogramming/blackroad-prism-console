'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/card';
import type { IncidentAuditRecord } from '../../../api/pd/audit/route';

interface PagerDutyCreateResponse {
  ok: boolean;
  pagerDuty?: { id: string; url: string };
  jira?: { key: string; url: string } | null;
  error?: string;
  systemKey?: string;
}

interface PagerDutyResolveResponse {
  ok: boolean;
  incidentId?: string;
  pagerDuty?: { id: string; url: string };
  jira?: { key: string; url: string } | null;
  error?: string;
}

interface PagerDutyBulkResponse {
  ok: boolean;
  pagerDuty?: { id: string; url: string };
  jira?: { key: string; url: string };
  error?: string;
}

type GroupedIncident = {
  pdIncidentId: string;
  latestAction: IncidentAuditRecord['action'];
  jiraKey: string | null;
  pdUrl: string | null;
  systemKey: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
  events: IncidentAuditRecord[];
};

type ActionLinks = {
  pd?: { id: string; url: string };
  jira?: { key: string; url: string };
};

interface ActionState {
  loading: boolean;
  message: string | null;
  error: string | null;
  links?: ActionLinks;
}

const jiraBase = process.env.NEXT_PUBLIC_JIRA_BASE ?? process.env.NEXT_PUBLIC_JIRA_URL ?? 'https://yourdomain.atlassian.net';

function groupByIncident(records: IncidentAuditRecord[]): GroupedIncident[] {
  const map = new Map<string, GroupedIncident>();
  for (const record of records) {
    const id = record.pd_incident_id ?? `audit-${record.id}`;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        pdIncidentId: record.pd_incident_id ?? '',
        latestAction: record.action,
        jiraKey: record.jira_key,
        pdUrl: record.pd_url,
        systemKey: record.system_key,
        openedAt: record.opened_at,
        resolvedAt: record.resolved_at,
        events: [record],
      });
    } else {
      existing.events.push(record);
      if (record.time > existing.events[0].time) {
        existing.latestAction = record.action;
        existing.jiraKey = record.jira_key;
        existing.pdUrl = record.pd_url;
        existing.systemKey = record.system_key;
        existing.openedAt = record.opened_at ?? existing.openedAt;
        existing.resolvedAt = record.resolved_at ?? existing.resolvedAt;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const aTime = a.events[0]?.time ?? '';
    const bTime = b.events[0]?.time ?? '';
    return bTime.localeCompare(aTime);
  });
}

function formatDate(value: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function OpsIncidentsPage() {
  const [records, setRecords] = useState<IncidentAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createState, setCreateState] = useState<ActionState>({
    loading: false,
    message: null,
    error: null,
  });

  const [resolveState, setResolveState] = useState<ActionState>({
    loading: false,
    message: null,
    error: null,
  });

  const [bulkState, setBulkState] = useState<ActionState>({
    loading: false,
    message: null,
    error: null,
  });

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pd/audit', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Failed to load audit records');
      }
      setRecords(Array.isArray(body.records) ? body.records : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to load audit records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const incidents = useMemo(() => groupByIncident(records), [records]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const runbookValue = data.get('runbookUrls');
    const runbooks = typeof runbookValue === 'string'
      ? runbookValue
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
      : [];

    const labelValue = data.get('labels');
    const labels = typeof labelValue === 'string'
      ? labelValue
          .split(',')
          .map(label => label.trim())
          .filter(Boolean)
      : [];

    setCreateState({ loading: true, message: null, error: null });
    try {
      const res = await fetch('/api/pd/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(data.get('title') ?? ''),
          bodyMd: String(data.get('bodyMd') ?? ''),
          systemKey: String(data.get('systemKey') ?? ''),
          serviceId: String(data.get('serviceId') ?? ''),
          urgency: String(data.get('urgency') ?? 'high'),
          escalationPolicyId: data.get('escalationPolicyId')
            ? String(data.get('escalationPolicyId'))
            : undefined,
          runbookUrls: runbooks,
          labels,
        }),
      });
      const body = (await res.json()) as PagerDutyCreateResponse;
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Unable to create incident');
      }
      setCreateState({
        loading: false,
        message: 'PagerDuty and Jira created successfully.',
        error: null,
        links: {
          pd: body.pagerDuty,
          jira: body.jira ?? undefined,
        },
      });
      form.reset();
      await loadAudit();
    } catch (err) {
      setCreateState({
        loading: false,
        message: null,
        error: err instanceof Error ? err.message : 'Unable to create incident',
      });
    }
  }

  async function handleResolve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const incidentId = String(data.get('incidentId') ?? '');
    const resolution = data.get('resolution');
    const postmortem = data.get('postmortemUrl');

    setResolveState({ loading: true, message: null, error: null });
    try {
      const res = await fetch('/api/pd/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          resolution: resolution ? String(resolution) : undefined,
          postmortemUrl: postmortem ? String(postmortem) : undefined,
        }),
      });
      const body = (await res.json()) as PagerDutyResolveResponse;
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Unable to resolve incident');
      }
      setResolveState({
        loading: false,
        message: 'Incident resolved.',
        error: null,
        links: {
          pd: body.pagerDuty,
          jira: body.jira ?? undefined,
        },
      });
      form.reset();
      await loadAudit();
    } catch (err) {
      setResolveState({
        loading: false,
        message: null,
        error: err instanceof Error ? err.message : 'Unable to resolve incident',
      });
    }
  }

  async function handleBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const systemsValue = data.get('systems');
    const systems = typeof systemsValue === 'string'
      ? systemsValue
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
      : [];
    const tasks = data.get('tasksMarkdown');

    setBulkState({ loading: true, message: null, error: null });
    try {
      const res = await fetch('/api/pd/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdIncidentId: String(data.get('pdIncidentId') ?? ''),
          pdUrl: String(data.get('pdUrl') ?? ''),
          systems,
          tasksMarkdown: tasks ? String(tasks) : '',
        }),
      });
      const body = (await res.json()) as PagerDutyBulkResponse;
      if (!res.ok || !body.ok) {
        throw new Error(body.error || 'Unable to create sweep coordination ticket');
      }
      setBulkState({
        loading: false,
        message: 'Sweep coordination ticket created.',
        error: null,
        links: {
          pd: body.pagerDuty,
          jira: body.jira,
        },
      });
      form.reset();
      await loadAudit();
    } catch (err) {
      setBulkState({
        loading: false,
        message: null,
        error: err instanceof Error ? err.message : 'Unable to create sweep coordination ticket',
      });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Incident automation</h1>
        <p className="text-sm text-slate-400">
          Creating or resolving PagerDuty incidents now mirrors the state in Jira automatically.
          We keep the Ops audit trail tidy and show cross-links on every card.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">Open PagerDuty incident</h2>
          <form className="space-y-3 text-sm" onSubmit={handleCreate}>
            <div>
              <label className="mb-1 block text-slate-300" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                placeholder="[DB] Latency spike"
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-300" htmlFor="bodyMd">
                Body (Markdown)
              </label>
              <textarea
                id="bodyMd"
                name="bodyMd"
                required
                className="h-32 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                placeholder="Runbook notes, impact, responders"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="systemKey">
                  System key
                </label>
                <input
                  id="systemKey"
                  name="systemKey"
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="payments-api"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="serviceId">
                  PagerDuty service ID
                </label>
                <input
                  id="serviceId"
                  name="serviceId"
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="PXXXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="urgency">
                  Urgency
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  defaultValue="high"
                >
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="escalationPolicyId">
                  Escalation policy (optional)
                </label>
                <input
                  id="escalationPolicyId"
                  name="escalationPolicyId"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="PEXXXXX"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-slate-300" htmlFor="runbookUrls">
                Runbook URLs (one per line)
              </label>
              <textarea
                id="runbookUrls"
                name="runbookUrls"
                className="h-20 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-300" htmlFor="labels">
                Extra Jira labels (comma separated)
              </label>
              <input
                id="labels"
                name="labels"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400"
              disabled={createState.loading}
            >
              {createState.loading ? 'Creating…' : 'Create PD + Jira'}
            </button>
            {createState.message && <p className="text-sm text-emerald-400">{createState.message}</p>}
            {createState.links && (
              <div className="flex flex-wrap gap-2 text-xs">
                {createState.links.pd && (
                  <a
                    href={createState.links.pd.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-slate-700/50 px-2 py-1 font-semibold text-slate-200"
                  >
                    PagerDuty {createState.links.pd.id}
                  </a>
                )}
                {createState.links.jira && (
                  <a
                    href={createState.links.jira.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/40"
                  >
                    Jira {createState.links.jira.key}
                  </a>
                )}
              </div>
            )}
            {createState.error && <p className="text-sm text-rose-400">{createState.error}</p>}
          </form>
        </Card>

        <Card className="space-y-6 border border-slate-800 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Resolve incident</h2>
            <form className="space-y-3 text-sm" onSubmit={handleResolve}>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="incidentId">
                  PagerDuty incident ID
                </label>
                <input
                  id="incidentId"
                  name="incidentId"
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="PIXXXX"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="resolution">
                  Resolution summary
                </label>
                <input
                  id="resolution"
                  name="resolution"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="Mitigated by scaling read replicas"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="postmortemUrl">
                  Post-mortem URL (optional)
                </label>
                <input
                  id="postmortemUrl"
                  name="postmortemUrl"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="https://docs.google.com/..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-emerald-500 px-4 py-2 font-medium text-white transition hover:bg-emerald-400"
                disabled={resolveState.loading}
              >
                {resolveState.loading ? 'Resolving…' : 'Resolve PD + Jira'}
              </button>
              {resolveState.message && <p className="text-sm text-emerald-400">{resolveState.message}</p>}
              {resolveState.links && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {resolveState.links.pd && (
                    <a
                      href={resolveState.links.pd.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-slate-700/50 px-2 py-1 font-semibold text-slate-200"
                    >
                      PagerDuty {resolveState.links.pd.id}
                    </a>
                  )}
                  {resolveState.links.jira && (
                    <a
                      href={resolveState.links.jira.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/40"
                    >
                      Jira {resolveState.links.jira.key}
                    </a>
                  )}
                </div>
              )}
              {resolveState.error && <p className="text-sm text-rose-400">{resolveState.error}</p>}
            </form>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-4">
            <h2 className="text-lg font-semibold text-white">Risk sweep coordination</h2>
            <form className="space-y-3 text-sm" onSubmit={handleBulk}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-300" htmlFor="pdIncidentId">
                    PagerDuty incident ID
                  </label>
                  <input
                    id="pdIncidentId"
                    name="pdIncidentId"
                    required
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300" htmlFor="pdUrl">
                    PagerDuty link
                  </label>
                  <input
                    id="pdUrl"
                    name="pdUrl"
                    required
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="systems">
                  Systems (one per line)
                </label>
                <textarea
                  id="systems"
                  name="systems"
                  required
                  className="h-20 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-slate-300" htmlFor="tasksMarkdown">
                  Checklist / tasks
                </label>
                <textarea
                  id="tasksMarkdown"
                  name="tasksMarkdown"
                  className="h-24 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="- Verify failover scripts\n- Confirm comms sent"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-400"
                disabled={bulkState.loading}
              >
                {bulkState.loading ? 'Creating…' : 'Create Jira coordination issue'}
              </button>
              {bulkState.message && <p className="text-sm text-emerald-400">{bulkState.message}</p>}
              {bulkState.links && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {bulkState.links.pd && (
                    <a
                      href={bulkState.links.pd.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-slate-700/50 px-2 py-1 font-semibold text-slate-200"
                    >
                      PagerDuty {bulkState.links.pd.id}
                    </a>
                  )}
                  {bulkState.links.jira && (
                    <a
                      href={bulkState.links.jira.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-indigo-500/10 px-2 py-1 font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/40"
                    >
                      Jira {bulkState.links.jira.key}
                    </a>
                  )}
                </div>
              )}
              {bulkState.error && <p className="text-sm text-rose-400">{bulkState.error}</p>}
            </form>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Latest activity</h2>
          <button
            type="button"
            onClick={loadAudit}
            className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300 transition hover:border-slate-500"
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {incidents.length === 0 && !loading && (
          <p className="text-sm text-slate-400">No incidents logged yet.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {incidents.map(incident => (
            <Card
              key={String(incident.pdIncidentId || incident.events[0]?.id)}
              className="space-y-3 border border-slate-800 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {incident.systemKey || 'Unmapped system'}
                  </p>
                  <p className="text-xs text-slate-400">{incident.pdIncidentId || 'Audit event'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {incident.jiraKey && (
                    <a
                      href={`${jiraBase.replace(/\/$/, '')}/browse/${incident.jiraKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/40"
                    >
                      Jira {incident.jiraKey}
                    </a>
                  )}
                  {incident.pdUrl && (
                    <a
                      href={incident.pdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-700/40 px-3 py-1 text-xs font-semibold text-slate-200"
                    >
                      PagerDuty
                    </a>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Opened:</span>{' '}
                  {formatDate(incident.openedAt ?? incident.events.at(-1)?.time ?? null)}
                </div>
                <div>
                  <span className="text-slate-500">Resolved:</span>{' '}
                  {formatDate(incident.resolvedAt)}
                </div>
              </div>
              <ul className="space-y-1 text-xs text-slate-400">
                {incident.events.map(event => (
                  <li key={event.id} className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                      {event.action}
                    </span>
                    <span>{formatDate(event.time)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
