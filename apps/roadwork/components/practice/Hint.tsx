'use client';

import { useState } from 'react';

export function Hint({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded border border-brand-500 bg-white px-3 py-1 text-sm text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-expanded={open}
      >
        {open ? 'Hide hint' : 'Show hint'}
      </button>
      {open ? (
        <p className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" role="note">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
