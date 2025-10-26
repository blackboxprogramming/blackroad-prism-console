import { describe, expect, it } from 'vitest';
import { cosineSimilarity, embedText } from '../../src/ui/lib/vectors';

describe('vectors', () => {
  it('produces deterministic embeddings', () => {
    expect(embedText('hello')).toEqual(embedText('hello'));
  });

  it('computes cosine similarity between identical vectors as 1', () => {
    const vector = embedText('lucidia');
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
  });

  it('computes cosine similarity between orthogonal strings as bounded', () => {
    const a = embedText('memory');
    const b = embedText('tasks');
    expect(cosineSimilarity(a, b)).toBeLessThanOrEqual(1);
    expect(cosineSimilarity(a, b)).toBeGreaterThanOrEqual(-1);
  });
});
