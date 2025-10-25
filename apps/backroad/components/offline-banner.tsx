'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE ?? 'true';

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online && mockMode !== 'true') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'bg-amber-500/10 text-amber-200',
        'px-4 py-2 text-sm sm:px-6 lg:px-8',
        className,
      )}
    >
      {mockMode === 'true'
        ? 'Mock mode enabled — data served from local fixtures.'
        : 'Offline — queued actions will send once you reconnect.'}
    </div>
  );
}
