'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdaptiveQuiz } from '@/hooks/useAdaptiveQuiz';
import { useTelemetry } from '@/hooks/useTelemetry';
import { ChallengeLevelChip } from '@/components/quiz/ChallengeLevelChip';
import { Stepper } from '@/components/quiz/Stepper';
import { QuestionFrame } from '@/components/practice/QuestionFrame';
import { MCQ } from '@/components/practice/MCQ';
import { Numeric } from '@/components/practice/Numeric';
import { ShortText } from '@/components/practice/ShortText';
import { Timer } from '@/components/quiz/Timer';
import { ScoreCard } from '@/components/feedback/ScoreCard';
import { MasteryFeedback } from '@/components/feedback/MasteryFeedback';
import { RateLimitGuard } from '@/components/utils/RateLimitGuard';
import { ToastLiveRegion } from '@/components/navigation/ToastLiveRegion';
import {
  quizNextResponseSchema,
  quizStartResponseSchema,
  quizSubmitResponseSchema,
  type Question
} from '@/lib/schemas';

const TOTAL_ITEMS = 8;

export default function QuizPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string | number | string[] | null>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const { state, start, answer, next, complete, challengeLevel } = useAdaptiveQuiz();
  const { track, flush } = useTelemetry();

  useEffect(() => {
    const controller = new AbortController();
    async function boot() {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ slug }),
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      const parsed = quizStartResponseSchema.parse(await res.json());
      start({
        attemptId: parsed.attemptId,
        lessonId: parsed.lessonId,
        question: parsed.firstQuestion,
        totalItems: TOTAL_ITEMS
      });
      setQuestions([parsed.firstQuestion]);
    }
    boot().catch((error) => {
      console.error(error);
      setFeedback('Unable to start quiz.');
    });
    return () => controller.abort();
  }, [slug, start]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.currentQuestion) return;
    const response = responses[state.currentQuestion.id] ?? null;
    answer({
      question: state.currentQuestion,
      correct: null,
      response,
      durationMs: 20000
    });
    if (state.remaining <= 0) {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ attemptId: state.attemptId, responses }),
        headers: { 'Content-Type': 'application/json' }
      });
      const parsed = quizSubmitResponseSchema.parse(await res.json());
      setScore(parsed.score);
      setCompleted(true);
      complete();
      track({ type: 'quiz_submit', payload: { attemptId: state.attemptId, score: parsed.score } });
      flush();
    } else {
      const res = await fetch('/api/quiz/next', {
        method: 'POST',
        body: JSON.stringify({ attemptId: state.attemptId }),
        headers: { 'Content-Type': 'application/json' }
      });
      const parsed = quizNextResponseSchema.parse(await res.json());
      setQuestions((prev) => {
        const combined = [...prev, parsed.question];
        next(combined as any);
        return combined;
      });
    }
  };

  useEffect(() => {
    if (state.currentQuestion) {
      setFeedback(null);
    }
  }, [state.currentQuestion]);

  return (
    <ToastLiveRegion message={feedback}>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Adaptive quiz</h1>
          <div className="flex items-center gap-4">
            <Stepper current={state.history.length + (state.currentQuestion ? 1 : 0)} total={TOTAL_ITEMS} />
            <ChallengeLevelChip difficulty={challengeLevel} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(event) => setTimerEnabled(event.target.checked)}
              />
              Timer
            </label>
            <Timer enabled={timerEnabled} />
          </div>
        </header>
        {completed && score !== null ? (
          <div className="space-y-4">
            <ScoreCard score={score} />
            <MasteryFeedback score={score} />
          </div>
        ) : null}
        {!completed && state.currentQuestion ? (
          <RateLimitGuard userId="local-user">
            {({ onAttempt }) => (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  if (!onAttempt()) {
                    event.preventDefault();
                    return;
                  }
                  handleSubmit(event).catch((error) => {
                    console.error(error);
                    setFeedback('Submission failed.');
                  });
                }}
              >
                <QuestionFrame
                  id={`quiz-${state.currentQuestion.id}`}
                  title={state.currentQuestion.stem}
                  description="Choose your response"
                >
                  {state.currentQuestion.kind === 'mcq' ? (
                    <MCQ
                      question={state.currentQuestion}
                      value={(responses[state.currentQuestion.id] as string) ?? null}
                      onChange={(value) =>
                        setResponses((prev) => ({
                          ...prev,
                          [state.currentQuestion!.id]: value
                        }))
                      }
                    />
                  ) : null}
                  {state.currentQuestion.kind === 'numeric' ? (
                    <Numeric
                      value={responses[state.currentQuestion.id] as number | null}
                      onChange={(value) =>
                        setResponses((prev) => ({
                          ...prev,
                          [state.currentQuestion!.id]: value
                        }))
                      }
                    />
                  ) : null}
                  {state.currentQuestion.kind === 'short' ? (
                    <ShortText
                      value={(responses[state.currentQuestion.id] as string) ?? ''}
                      onChange={(value) =>
                        setResponses((prev) => ({
                          ...prev,
                          [state.currentQuestion!.id]: value
                        }))
                      }
                    />
                  ) : null}
                </QuestionFrame>
                <button
                  type="submit"
                  className="rounded bg-brand-500 px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  {state.remaining <= 0 ? 'Submit quiz' : 'Next question'}
                </button>
              </form>
            )}
          </RateLimitGuard>
        ) : null}
      </div>
    </ToastLiveRegion>
  );
}
