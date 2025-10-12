'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BrLogEntry } from '@/lib/debug/brLog';
import { getBrLogHistory, subscribeToBrLog } from '@/lib/debug/brLog';

const DEBUG_CONSOLE_FLAG = process.env.NEXT_PUBLIC_DEBUG_CONSOLE;
const ENABLED =
  DEBUG_CONSOLE_FLAG === 'true' ||
  (DEBUG_CONSOLE_FLAG !== 'false' && process.env.NODE_ENV !== 'production');
const MAX_RENDERED = 200;

function levelColor(level: BrLogEntry['level']) {
  switch (level) {
    case 'error':
      return '#ef4444';
    case 'warn':
      return '#f97316';
    case 'debug':
      return '#38bdf8';
    default:
      return '#22c55e';
  }
}

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return date.toLocaleTimeString();
}

export default function DebugConsole() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<BrLogEntry[]>([]);

  useEffect(() => {
    setEntries(getBrLogHistory());
    const unsubscribe = subscribeToBrLog((entry) => {
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.slice(-MAX_RENDERED);
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '`') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const body = useMemo(() => {
    return entries
      .slice()
      .reverse()
      .map((entry) => ({ ...entry, data: entry.data }));
  }, [entries]);

  if (!ENABLED) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          position: 'fixed',
          right: '1rem',
          bottom: open ? '18rem' : '1rem',
          zIndex: 10000,
          background: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          padding: '0.5rem 1rem',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.35)',
          cursor: 'pointer',
        }}
      >
        {open ? 'Close Debug' : 'Open Debug'}
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: '1rem',
            bottom: '1rem',
            width: 'min(480px, 90vw)',
            maxHeight: '16rem',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#f8fafc',
            borderRadius: '0.75rem',
            padding: '1rem',
            overflow: 'auto',
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            fontSize: '0.75rem',
            zIndex: 9999,
            boxShadow: '0 20px 35px rgba(15, 23, 42, 0.45)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong>Debug Console</strong>
            <span style={{ opacity: 0.7 }}>⌘ + `</span>
          </div>
          {body.length === 0 && (
            <div style={{ opacity: 0.6 }}>No log entries captured yet.</div>
          )}
          {body.map((entry) => (
            <div
              key={entry.id}
              style={{
                borderLeft: `3px solid ${levelColor(entry.level)}`,
                paddingLeft: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>{entry.message}</span>
                <span style={{ opacity: 0.5 }}>{formatTimestamp(entry.timestamp)}</span>
              </div>
              {entry.data != null && (
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    color: '#cbd5f5',
                  }}
                >
                  {JSON.stringify(entry.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
