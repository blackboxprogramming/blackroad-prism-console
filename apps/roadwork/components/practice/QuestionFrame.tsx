'use client';

import { ReactNode } from 'react';

export function QuestionFrame({
  id,
  title,
  description,
  children
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset
      aria-describedby={`${id}-description`}
      role="group"
      className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow-sm"
    >
      <legend className="text-lg font-semibold">{title}</legend>
      <p id={`${id}-description`} className="text-sm text-slate-600">
        {description}
      </p>
      {children}
    </fieldset>
  );
}
