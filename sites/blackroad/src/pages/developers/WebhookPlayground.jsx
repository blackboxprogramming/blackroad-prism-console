import React, { useState } from 'react';
import { verifySignature } from './utils/signature.js';

const WebhookPlayground = () => {
  const [payload, setPayload] = useState('{"eventId":"evt_demo","type":"deploy.released"}');
  const [secret, setSecret] = useState('whsec_demo');
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [signature, setSignature] = useState('');
  const [valid, setValid] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    setBusy(true);
    const result = await verifySignature({ payload, secret, timestamp, signature });
    setValid(result);
    setBusy(false);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Webhook Playground</h2>
      <p className="mt-2 text-sm text-slate-600">
        Paste a webhook payload and signature to confirm HMAC verification before going live.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleVerify}>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Payload
          <textarea
            className="mt-1 w-full rounded border border-slate-200 p-2 font-mono text-sm"
            rows={4}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Secret
          <input
            className="mt-1 w-full rounded border border-slate-200 p-2 font-mono text-sm"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Timestamp (seconds)
          <input
            className="mt-1 w-full rounded border border-slate-200 p-2 font-mono text-sm"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Signature (hex)
          <input
            className="mt-1 w-full rounded border border-slate-200 p-2 font-mono text-sm"
            value={signature}
            onChange={(event) => setSignature(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700"
          disabled={busy}
        >
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      {valid !== null && (
        <div className={`mt-4 rounded border p-3 text-sm ${valid ? 'border-emerald-400 text-emerald-700' : 'border-rose-400 text-rose-700'}`}>
          {valid ? 'Signature valid' : 'Signature mismatch'}
        </div>
      )}
    </div>
  );
};

export default WebhookPlayground;
