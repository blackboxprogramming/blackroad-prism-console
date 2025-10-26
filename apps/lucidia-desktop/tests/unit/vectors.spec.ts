import { describe, expect, it } from 'vitest';
import { cosineSimilarity, embedText, rankVectors } from '@/ui/lib/vectors';

describe('embedText', () => {
  it('produces deterministic vectors', () => {
    const one = embedText('Lucidia');
    const two = embedText('Lucidia');
    expect(one).toEqual(two);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const vector = embedText('local-first');
    expect(cosineSimilarity(vector, vector)).toBeCloseTo(1, 5);
  });

  it('returns lower values for different vectors', () => {
    const a = embedText('memory storage');
    const b = embedText('task execution');
    expect(cosineSimilarity(a, b)).toBeLessThan(1);
  });
});

describe('rankVectors', () => {
  it('sorts vectors by similarity', () => {
    const query = embedText('lucidia desk');
    const first = embedText('lucidia desk');
    const second = embedText('totally unrelated');
    const ranked = rankVectors(query, [second, first]);
    expect(ranked[0].index).toBe(1);
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
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
