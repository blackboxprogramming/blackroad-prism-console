import React from 'react';

const severityColors = {
  error: '#ef4444',
  warn: '#f59e0b',
  info: '#3b82f6',
  debug: '#6b7280',
  critical: '#dc2626',
};

export function EventRow({ event }) {
  const severityColor = severityColors[event.severity] ?? '#0f172a';
  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ fontWeight: 600 }}>{new Date(event.ts).toLocaleTimeString()}</span>
        <span style={{ color: severityColor }}>{event.severity ?? 'info'}</span>
      </div>
      <div style={{ marginTop: '0.25rem', color: '#1f2937' }}>
        {event.source} · {event.service} · {event.kind}
      </div>
      <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
        {event.notes?.length ? event.notes.join(' ') : JSON.stringify(event.attrs)}
      </div>
    </div>
  );
}

export default EventRow;

