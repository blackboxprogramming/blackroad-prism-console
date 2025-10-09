export function randWeighted<T>(pairs: Array<[T, number]>): T {
  const sum = pairs.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * sum;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[0][0];
}

export function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
