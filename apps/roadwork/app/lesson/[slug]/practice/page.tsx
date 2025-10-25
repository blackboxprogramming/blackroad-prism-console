'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePractice } from '@/hooks/usePractice';
import { useLesson } from '@/hooks/useLesson';
import { QuestionFrame } from '@/components/practice/QuestionFrame';
import { MCQ } from '@/components/practice/MCQ';
import { Numeric } from '@/components/practice/Numeric';
import { ShortText } from '@/components/practice/ShortText';
import { Hint } from '@/components/practice/Hint';
import { SolutionDialog } from '@/components/practice/SolutionDialog';
import { ToastLiveRegion } from '@/components/navigation/ToastLiveRegion';

export default function PracticePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const { data: lesson } = useLesson(slug);
  const { data: questions = [], isLoading, isError } = usePractice(slug);
  const [responses, setResponses] = useState<Record<string, string | number | string[] | null>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const practiceQuestions = useMemo(() => questions.slice(0, 5), [questions]);

  return (
    <ToastLiveRegion message={feedback ?? (isError ? 'Practice unavailable.' : null)}>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Practice</h1>
          <p className="text-slate-600">
            {lesson?.title ? `Warm up for “${lesson.title}” with sample questions.` : 'Warm up with sample questions.'}
          </p>
        </header>
        {isLoading ? <p>Loading practice…</p> : null}
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setFeedback('Practice responses saved locally.');
          }}
        >
          {practiceQuestions.map((question, index) => (
            <QuestionFrame
              key={question.id}
              id={`practice-${question.id}`}
              title={`Question ${index + 1}`}
              description={question.stem}
            >
              {question.kind === 'mcq' ? (
                <MCQ
                  question={question}
                  value={(responses[question.id] as string) ?? null}
                  onChange={(value) =>
                    setResponses((prev) => ({
                      ...prev,
                      [question.id]: value
                    }))
                  }
                />
              ) : null}
              {question.kind === 'numeric' ? (
                <Numeric
                  value={responses[question.id] as number | null}
                  onChange={(value) =>
                    setResponses((prev) => ({
                      ...prev,
                      [question.id]: value
                    }))
                  }
                />
              ) : null}
              {question.kind === 'short' ? (
                <ShortText
                  value={(responses[question.id] as string) ?? ''}
                  onChange={(value) =>
                    setResponses((prev) => ({
                      ...prev,
                      [question.id]: value
                    }))
                  }
                />
              ) : null}
              {question.hints?.[0] ? <Hint hint={question.hints[0]} /> : null}
              <SolutionDialog solution="Reflect on the steps from the lesson to confirm your reasoning." />
            </QuestionFrame>
          ))}
          {practiceQuestions.length > 0 ? (
            <button
              type="submit"
              className="rounded bg-brand-500 px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              Save practice notes
            </button>
          ) : null}
        </form>
      </div>
    </ToastLiveRegion>
  );
}
