import React from 'react';

export default function JsonCard({ artifact }) {
  if (!artifact) {
    return <div className="text-sm text-slate-500">No JSON payload.</div>;
  }
  const json = artifact.json ?? artifact.payload ?? artifact;
  return (
    <pre className="max-h-[520px] overflow-auto rounded border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
      {JSON.stringify(json, null, 2)}
    </pre>
  );
}
