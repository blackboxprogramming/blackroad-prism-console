'use client';

import { ReactNode, useState } from 'react';
import { rateLimitAttempts } from '@/lib/rateLimit';

export function RateLimitGuard({ userId, children }: { userId: string; children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  const handleSubmit = () => {
    const { allowed } = rateLimitAttempts(userId);
    setBlocked(!allowed);
    return allowed;
  };

  return (
    <div>
      {blocked ? (
        <div
          role="alert"
          className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          Too many attempts in a short period. Please wait before trying again.
        </div>
      ) : null}
      {typeof children === 'function'
        ? (children as (props: { onAttempt: () => boolean }) => ReactNode)({ onAttempt: handleSubmit })
        : children}
    </div>
  );
}
