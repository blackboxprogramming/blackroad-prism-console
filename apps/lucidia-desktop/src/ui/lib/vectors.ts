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
  if (magA === 0 || magB === 0) {
    return 0;
  }
  return dot / Math.sqrt(magA * magB);
}
