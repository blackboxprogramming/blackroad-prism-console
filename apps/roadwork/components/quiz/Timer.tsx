'use client';

import { useEffect, useState } from 'react';

export function Timer({ enabled }: { enabled: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div aria-live="polite" className="text-sm text-slate-600">
      Elapsed: {minutes}:{remainingSeconds.toString().padStart(2, '0')}
    </div>
  );
}
