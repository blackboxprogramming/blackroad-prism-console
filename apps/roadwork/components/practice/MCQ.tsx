'use client';

import { ChangeEvent } from 'react';
import type { Question } from '@/lib/schemas';

type Props = {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
};

export function MCQ({ question, value, onChange }: Props) {
  if (!question.choices) return null;
  return (
    <div role="radiogroup" aria-label="Answer choices" className="space-y-2">
      {question.choices.map((choice) => (
        <label key={choice.id} className="flex items-center gap-3 rounded border border-slate-200 px-3 py-2">
          <input
            type="radio"
            name={`choice-${question.id}`}
            value={choice.id}
            checked={value === choice.id}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
            className="h-4 w-4"
          />
          <span>{choice.text}</span>
        </label>
      ))}
    </div>
  );
}
