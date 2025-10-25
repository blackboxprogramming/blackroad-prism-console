'use client';

import { useCallback, useMemo, useReducer } from 'react';
import { nextQuestionByDifficulty, recommendDifficulty, type Difficulty } from '@/lib/adaptivity';
import type { Question } from '@/lib/schemas';

export type QuizState = {
  attemptId: string;
  lessonId: string;
  history: {
    questionId: string;
    correct: boolean | null;
    durationMs: number;
    difficultyServed: Difficulty;
    response: string | number | string[] | null;
  }[];
  currentQuestion: Question | null;
  remaining: number;
};

type QuizAction =
  | { type: 'start'; payload: { attemptId: string; lessonId: string; question: Question; remaining: number } }
  | {
      type: 'answer';
      payload: {
        question: Question;
        correct: boolean | null;
        response: string | number | string[] | null;
        durationMs: number;
      };
    }
  | { type: 'next'; payload: { questions: Question[] } }
  | { type: 'complete' };

const initialState: QuizState = {
  attemptId: '',
  lessonId: '',
  history: [],
  currentQuestion: null,
  remaining: 0
};

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'start':
      return {
        attemptId: action.payload.attemptId,
        lessonId: action.payload.lessonId,
        history: [],
        currentQuestion: action.payload.question,
        remaining: action.payload.remaining
      };
    case 'answer': {
      const nextHistory = [
        ...state.history,
        {
          questionId: action.payload.question.id,
          correct: action.payload.correct,
          durationMs: action.payload.durationMs,
          difficultyServed: action.payload.question.difficulty,
          response: action.payload.response
        }
      ];
      return {
        ...state,
        history: nextHistory,
        currentQuestion: null,
        remaining: Math.max(state.remaining - 1, 0)
      };
    }
    case 'next': {
      if (!state.attemptId) return state;
      const asked = new Set(state.history.map((item) => item.questionId));
      const currentDifficulty = state.history.at(-1)?.difficultyServed ?? 1;
      const desired = recommendDifficulty(state.history, currentDifficulty);
      const nextQuestion = nextQuestionByDifficulty(action.payload.questions, desired, asked);
      return {
        ...state,
        currentQuestion: nextQuestion,
        remaining: Math.max(state.remaining, 0)
      };
    }
    case 'complete':
      return { ...state, currentQuestion: null, remaining: 0 };
    default:
      return state;
  }
}

export function useAdaptiveQuiz() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback(
    (payload: { attemptId: string; lessonId: string; question: Question; totalItems: number }) => {
      dispatch({
        type: 'start',
        payload: {
          attemptId: payload.attemptId,
          lessonId: payload.lessonId,
          question: payload.question,
          remaining: payload.totalItems - 1
        }
      });
    },
    []
  );

  const answer = useCallback(
    (payload: {
      question: Question;
      correct: boolean | null;
      response: string | number | string[] | null;
      durationMs: number;
    }) => {
      dispatch({ type: 'answer', payload });
    },
    []
  );

  const next = useCallback((questions: Question[]) => {
    dispatch({ type: 'next', payload: { questions } });
  }, []);

  const complete = useCallback(() => dispatch({ type: 'complete' }), []);

  const challengeLevel = useMemo(() => {
    const last = state.history.at(-1);
    return last?.difficultyServed ?? state.currentQuestion?.difficulty ?? 1;
  }, [state.currentQuestion, state.history]);

  return { state, start, answer, next, complete, challengeLevel };
}
