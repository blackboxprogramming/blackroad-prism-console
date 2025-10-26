import { MAX_VECTOR_SIZE } from '@/shared/constants';

const PRIME = 31;

export const embedText = (text: string, dimensions = MAX_VECTOR_SIZE): number[] => {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.normalize('NFKD').toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    const index = (code * PRIME + i) % dimensions;
    vector[index] += (code % 13) / 12;
  }
  const magnitude = Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
function hashToVector(input: string, dimensions = 32): number[] {
  const vector = new Array(dimensions).fill(0);
  for (let i = 0; i < input.length; i += 1) {
    const charCode = input.charCodeAt(i);
    vector[i % dimensions] += (charCode % 97) / 48;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}

export function embedText(text: string): number[] {
  return hashToVector(text.normalize());
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const rankVectors = (query: number[], vectors: number[][]) => {
  return vectors
    .map((vector, index) => ({ index, score: cosineSimilarity(query, vector) }))
    .sort((a, b) => b.score - a.score);
};
  if (magA === 0 || magB === 0) {
    return 0;
  }
  return dot / Math.sqrt(magA * magB);
}
