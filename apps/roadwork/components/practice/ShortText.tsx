'use client';

import { ChangeEvent } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ShortText({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      className="h-32 w-full rounded border border-slate-300 px-3 py-2 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500"
    />
  );
}
