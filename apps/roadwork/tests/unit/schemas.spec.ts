import { describe, expect, it } from 'vitest';
import lessonsData from '@/mocks/fixtures/lessons.json';
import { lessonSchema, lessonsResponseSchema } from '@/lib/schemas';

describe('schemas', () => {
  it('validates lesson fixtures', () => {
    expect(() => lessonsResponseSchema.parse(lessonsData)).not.toThrow();
  });

  it('fails when outcomes missing', () => {
    const invalid = { ...lessonsData.lessons[0], outcomes: undefined } as any;
    expect(() => lessonSchema.parse(invalid)).toThrowError();
  });
});
