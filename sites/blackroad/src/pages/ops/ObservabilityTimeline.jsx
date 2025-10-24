import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import EventRow from '../../components/EventRow';

const fetcher = (url) => fetch(url).then((res) => res.json());

function buildQuery(filter) {
  const params = new URLSearchParams();
  if (filter.service) params.set('service', filter.service);
  if (filter.source) params.set('source', filter.source);
  if (filter.releaseId) params.set('releaseId', filter.releaseId);
  return `/api/obs/events?${params.toString()}`;
}

export default function ObservabilityTimelinePage() {
  const [filter, setFilter] = useState({ service: '', source: '', releaseId: '' });
  const { data, error, isLoading, mutate } = useSWR(buildQuery(filter), fetcher, {
    refreshInterval: 5000,
  });

  const events = useMemo(() => data?.events ?? [], [data]);

  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Ops Timeline</h1>
        <p style={{ color: '#475569' }}>
          Unified events from telemetry, deployments, caption jobs, and simulations. Adjust filters to investigate
          incidents.
        </p>
      </header>

      <section style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Service</span>
          <input
            value={filter.service}
            onChange={(event) => setFilter((prev) => ({ ...prev, service: event.target.value }))}
            placeholder="control-plane-gateway"
            style={{ padding: '0.5rem', border: '1px solid #cbd5f5', borderRadius: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Source</span>
          <input
            value={filter.source}
            onChange={(event) => setFilter((prev) => ({ ...prev, source: event.target.value }))}
            placeholder="otel"
            style={{ padding: '0.5rem', border: '1px solid #cbd5f5', borderRadius: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>Release</span>
          <input
            value={filter.releaseId}
            onChange={(event) => setFilter((prev) => ({ ...prev, releaseId: event.target.value }))}
            placeholder="rel-2024.10.05"
            style={{ padding: '0.5rem', border: '1px solid #cbd5f5', borderRadius: '0.5rem' }}
          />
        </label>
        <button
          type="button"
          onClick={() => mutate()}
          style={{ alignSelf: 'end', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#2563eb', color: '#fff', border: 'none' }}
        >
          Refresh
        </button>
      </section>

      <section style={{ background: '#fff', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' }}>
        {error && <div style={{ padding: '1rem', color: '#dc2626' }}>Failed to load events: {error.message}</div>}
        {isLoading && <div style={{ padding: '1rem' }}>Loading timeline…</div>}
        {!isLoading && !events.length && <div style={{ padding: '1rem', color: '#475569' }}>No events yet. Adjust filters or verify ingest.</div>}
        {events.map((event) => (
          <EventRow key={`${event.ts}-${event.service}-${event.source}-${event.kind}`} event={event} />
        ))}
      </section>
    </div>
  );
}

