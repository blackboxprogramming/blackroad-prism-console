import { Question } from './schemas';

export type Difficulty = 1 | 2 | 3;

export type QuizItem = {
  questionId: string;
  correct: boolean | null;
  durationMs: number;
  difficultyServed: Difficulty;
};

const MAX_DIFFICULTY: Difficulty = 3;
const MIN_DIFFICULTY: Difficulty = 1;

export function recommendDifficulty(
  history: QuizItem[],
  currentDifficulty: Difficulty,
  durationThresholdMs = 45000
): Difficulty {
  if (history.length < 2) {
    return currentDifficulty;
  }

  const lastTwo = history.slice(-2);
  const allCorrect = lastTwo.every((item) => item.correct === true);
  const anyIncorrect = lastTwo.some((item) => item.correct === false);
  const averageDuration =
    lastTwo.reduce((total, item) => total + item.durationMs, 0) / lastTwo.length;

  if (allCorrect && averageDuration < durationThresholdMs) {
    return Math.min((currentDifficulty + 1) as Difficulty, MAX_DIFFICULTY);
  }

  if (anyIncorrect || averageDuration > durationThresholdMs) {
    return Math.max((currentDifficulty - 1) as Difficulty, MIN_DIFFICULTY);
  }

  return currentDifficulty;
}

export function nextQuestionByDifficulty(
  questions: Question[],
  desiredDifficulty: Difficulty,
  asked: Set<string>
): Question | null {
  const available = questions.filter(
    (q) => q.difficulty === desiredDifficulty && !asked.has(q.id)
  );

  if (available.length === 0) {
    const fallback = questions.find((q) => !asked.has(q.id));
    return fallback ?? null;
  }

  const index = Math.floor(Math.random() * available.length);
  return available[index];
}
