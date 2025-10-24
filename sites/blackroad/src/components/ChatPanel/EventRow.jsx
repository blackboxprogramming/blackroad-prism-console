import React from 'react';

export default function EventRow({ event }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wide">{event.role}</span>
        <span>{new Date(event.ts).toLocaleTimeString()}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-slate-600">{event.text}</p>
    </div>
  );
}
