'use client';

import clsx from 'clsx';
import type { SafetyResult } from '@/lib/safety';

interface SafetyNoticeProps {
  warnings: SafetyResult;
}

export function SafetyNotice({ warnings }: SafetyNoticeProps) {
  if (!warnings.flags.length) {
    return (
      <p className="text-xs text-slate-400">
        Friendly reminder: BackRoad is metrics-free. Share responsibly and remember posts delay for
        reflection.
      </p>
    );
  }

  return (
    <div
      role="alert"
      className={clsx(
        'space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100',
      )}
    >
      <p className="font-semibold">Heads up before you queue:</p>
      <ul className="list-disc space-y-1 pl-5 text-xs">
        {warnings.flags.map((flag) => (
          <li key={flag.code}>{flag.message}</li>
        ))}
      </ul>
    </div>
  );
}
