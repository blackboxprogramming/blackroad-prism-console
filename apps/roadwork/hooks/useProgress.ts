import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

const STORAGE_KEY = 'rw-progress';
const ARCHIVE_PREFIX = 'rw-progress-corrupt-';

const progressSchema = z.object({
  lessons: z.record(
    z.object({
      mastery: z.number().min(0).max(1).default(0.5),
      lastAttemptScore: z.number().min(0).max(100).nullable(),
      updatedAt: z.string()
    })
  ),
  attempts: z.array(
    z.object({
      id: z.string(),
      lessonId: z.string(),
      score: z.number().min(0).max(100),
      createdAt: z.string()
    })
  )
});

export type ProgressState = z.infer<typeof progressSchema>;

const defaultState: ProgressState = {
  lessons: {},
  attempts: []
};

function readProgress(): ProgressState {
  if (typeof window === 'undefined') return defaultState;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;
  try {
    return progressSchema.parse(JSON.parse(raw));
  } catch (error) {
    const archiveKey = `${ARCHIVE_PREFIX}${Date.now()}.json`;
    window.localStorage.setItem(archiveKey, raw);
    window.localStorage.removeItem(STORAGE_KEY);
    console.warn('Progress corrupted, archived under', archiveKey, error);
    return defaultState;
  }
}

function writeProgress(state: ProgressState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(defaultState);

  useEffect(() => {
    setState(readProgress());
  }, []);

  useEffect(() => {
    if (state !== defaultState) {
      writeProgress(state);
    }
  }, [state]);

  const recordAttempt = useCallback(
    (attempt: { id: string; lessonId: string; score: number }) => {
      setState((prev) => {
        const attempts = [
          ...prev.attempts,
          { ...attempt, createdAt: new Date().toISOString() }
        ].slice(-20);
        const lessons = {
          ...prev.lessons,
          [attempt.lessonId]: {
            mastery: attempt.score / 100,
            lastAttemptScore: attempt.score,
            updatedAt: new Date().toISOString()
          }
        };
        return { lessons, attempts };
      });
    },
    []
  );

  const exportProgress = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importProgress = useCallback((json: string) => {
    const parsed = progressSchema.parse(JSON.parse(json));
    setState(parsed);
  }, []);

  const lastLesson = useMemo(() => {
    const ids = Object.entries(state.lessons)
      .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt));
    return ids[0]?.[0] ?? null;
  }, [state.lessons]);

  return { state, recordAttempt, exportProgress, importProgress, lastLesson };
}
