'use client';

import { ChangeEvent } from 'react';

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

export function Numeric({ value, onChange }: Props) {
  return (
    <input
      type="number"
      role="spinbutton"
      value={value ?? ''}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value === '' ? null : Number(event.target.value))
      }
      className="w-full rounded border border-slate-300 px-3 py-2 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500"
    />
  );
}
