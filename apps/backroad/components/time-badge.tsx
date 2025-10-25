'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TimeBadgeProps {
  visibleAt: string;
}

export function TimeBadge({ visibleAt }: TimeBadgeProps) {
  const target = new Date(visibleAt);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const delta = target.getTime() - now.getTime();
  const label = delta > 0 ? `${formatDistanceToNow(target)} remaining` : 'Visible';

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
      {label}
    </span>
  );
}
