'use client';

import { useEffect, useState } from 'react';
import { calculateRoomProgress } from '@/lib/time';

interface ExpiryRingProps {
  expiresAt: string;
  size?: number;
}

export function ExpiryRing({ expiresAt, size = 64 }: ExpiryRingProps) {
  const [progress, setProgress] = useState(() => calculateRoomProgress(expiresAt));

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress(calculateRoomProgress(expiresAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg
      role="img"
      aria-label={`Room expires in ${(progress * 100).toFixed(0)}% of remaining time`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-brand-400"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        fill="none"
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  );
}
