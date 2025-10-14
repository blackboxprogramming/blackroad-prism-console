export function metrics(seqTimes: number[]) {
  if (seqTimes.length < 2) {
    return { medianIoi: 0, minGap: seqTimes.length ? Infinity : 0 };
  }
  const iois: number[] = [];
  for (let i = 1; i < seqTimes.length; i += 1) {
    iois.push(seqTimes[i] - seqTimes[i - 1]);
  }
  const sorted = [...iois].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const minGap = iois.reduce((acc, val) => Math.min(acc, val), Number.POSITIVE_INFINITY);
  return { medianIoi: median, minGap };
}
