import React from 'react';
export function Card({ children, className = '' }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-[var(--shadow-md)] ${className}`}
      role="group"
    >
      {children}
    </div>
  );
}
