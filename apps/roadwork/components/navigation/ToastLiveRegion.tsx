'use client';

import { ReactNode, useEffect, useState } from 'react';

export function ToastLiveRegion({
  message,
  children
}: {
  message: string | null;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="space-y-4">
      {children}
      <div aria-live="polite" className="sr-only">
        {message}
      </div>
      {visible && message ? (
        <div
          role="status"
          className="rounded border border-brand-400 bg-brand-50 px-4 py-2 text-sm text-brand-800 shadow"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
