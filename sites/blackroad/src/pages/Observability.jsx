import { useEffect, useState } from 'react';
export default function Observability() {
  const [err, setErr] = useState('');
  useEffect(() => {}, []);
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Observability Panel</h2>
      <ul className="list-disc ml-5 text-sm">
        <li>
          Set <code>VITE_SENTRY_DSN</code> to send errors to Sentry.
        </li>
        <li>
          Set <code>VITE_OTEL_URL</code> to enable web tracing (coming soon).
        </li>
        <li>
          Uptime workflow pings every 10m; incidents labeled <code>incident</code>.
        </li>
        <li>
          Metrics at <code>/metrics</code>, Agent Inbox at <code>/inbox</code>.
        </li>
      </ul>
      <div className="mt-4">
        <button
          className="btn"
          onClick={() => {
            try {
              throw new Error('Manual test error from UI');
            } catch (e) {
              setErr(String(e.message));
              console.error(e);
            }
          }}
        >
          Trigger test error
        </button>
        {err && (
          <p className="text-xs mt-2 opacity-70">
            Thrown: <code>{err}</code> (will go to Sentry if DSN set)
          </p>
        )}
      </div>
    </div>
  );
}
