import { describe, expect, it } from 'vitest';
import { nextQuestionByDifficulty, recommendDifficulty } from '@/lib/adaptivity';

const questions = [
  { id: '1', lessonId: 'l', stem: '', kind: 'mcq', difficulty: 1 },
  { id: '2', lessonId: 'l', stem: '', kind: 'mcq', difficulty: 2 },
  { id: '3', lessonId: 'l', stem: '', kind: 'mcq', difficulty: 3 }
] as any;

describe('recommendDifficulty', () => {
  it('keeps current difficulty with insufficient history', () => {
    expect(recommendDifficulty([], 2)).toBe(2);
  });

  it('raises difficulty when last two correct and fast', () => {
    const history = [
      { questionId: '1', correct: true, durationMs: 1000, difficultyServed: 2 },
      { questionId: '2', correct: true, durationMs: 2000, difficultyServed: 2 }
    ];
    expect(recommendDifficulty(history, 2)).toBe(3);
  });

  it('drops difficulty when incorrect', () => {
    const history = [
      { questionId: '1', correct: false, durationMs: 1000, difficultyServed: 2 },
      { questionId: '2', correct: false, durationMs: 2000, difficultyServed: 2 }
    ];
    expect(recommendDifficulty(history, 2)).toBe(1);
  });
});

describe('nextQuestionByDifficulty', () => {
  it('returns question with desired difficulty', () => {
    const asked = new Set<string>();
    const question = nextQuestionByDifficulty(questions, 2, asked);
    expect(question?.difficulty).toBe(2);
  });

  it('falls back when difficulty missing', () => {
    const asked = new Set(['2']);
    const question = nextQuestionByDifficulty(questions, 2, asked);
    expect(question).not.toBeNull();
  });
});
