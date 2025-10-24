import React, { useState } from 'react';

const sampleKeys = {
  personalAccessToken: 'pat_live_xxxxx',
  sandboxServiceToken: 'srv_sandbox_xxxxx',
  clientId: 'client_12345',
};

const KeysPanel = () => {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('copy failed', error);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Sandbox Credentials</h2>
      <p className="mt-2 text-sm text-slate-600">
        Provisioned automatically for each developer workspace. Rotate tokens in-place or request elevated scopes.
      </p>
      <dl className="mt-4 space-y-3">
        {Object.entries(sampleKeys).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded border border-slate-100 p-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt>
              <dd className="font-mono text-sm text-slate-900">{value}</dd>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(value, key)}
              className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
            >
              {copiedField === key ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default KeysPanel;
