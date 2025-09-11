import React, { useState } from "react";

export interface Question {
  id: string;
  text: string;
  kind: "boolean" | "text" | "select";
  options?: string[];
  when?: { questionId: string; equals?: any; notEquals?: any; regex?: string }[];
}

export interface WizardProps {
  questions: Question[];
  onChange?(answers: Record<string, any>): void;
}

export function Wizard({ questions, onChange }: WizardProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const visible = (q: Question) =>
    !q.when ||
    q.when.every((g) => {
      const val = answers[g.questionId];
      if (g.equals !== undefined && val !== g.equals) return false;
      if (g.notEquals !== undefined && val === g.notEquals) return false;
      if (g.regex && !(typeof val === "string" && new RegExp(g.regex).test(val))) return false;
      return true;
    });

  const update = (id: string, val: any) => {
    const next = { ...answers, [id]: val };
    setAnswers(next);
    onChange?.(next);
  };

  return (
    <div>
      {questions.filter(visible).map((q) => (
        <label key={q.id}>
          {q.text}
          {q.kind === "boolean" && (
            <input type="checkbox" onChange={(e) => update(q.id, e.target.checked)} />
          )}
          {q.kind === "text" && (
            <input type="text" onChange={(e) => update(q.id, e.target.value)} />
          )}
          {q.kind === "select" && (
            <select onChange={(e) => update(q.id, e.target.value)}>
              {q.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
    </div>
  );
}

export default Wizard;
