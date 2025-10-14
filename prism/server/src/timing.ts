import type { Say } from './types.js';

export function quantizeMs(
  ms: number,
  bpm: number,
  div: '1/8' | '1/16' | '1/32' = '1/16',
  jitterMs = 10,
): number {
  const mspb = 60000 / bpm;
  const step = div === '1/8' ? mspb / 2 : div === '1/16' ? mspb / 4 : mspb / 8;
  const q = Math.round(ms / step) * step;
  const jitter = Math.max(-jitterMs, Math.min(jitterMs, (Math.random() * 2 - 1) * jitterMs));
  return Math.max(0, q + jitter);
}

export function beatToMs(
  beat: string,
  bpm: number,
  timeSig: [number, number] = [4, 4],
): number | undefined {
  const match = beat.match(/^@(\d+):(\d+):(\d+)$/);
  if (!match) return undefined;
  const [, barStr, beatStr, subStr] = match;
  const bar = Number(barStr);
  const beatIndex = Number(beatStr);
  const sub = Number(subStr);
  if (!Number.isFinite(bar) || !Number.isFinite(beatIndex) || !Number.isFinite(sub)) return undefined;
  const beatsPerBar = timeSig[0];
  const msPerBeat = 60000 / bpm;
  const msPerSub = msPerBeat / 4; // assume quarter subdivisions per beat (16th notes)
  const totalBeats = Math.max(0, (bar - 1) * beatsPerBar + (beatIndex - 1));
  return totalBeats * msPerBeat + Math.max(0, sub - 1) * msPerSub;
}

export function autofillBeats(
  seq: Say[],
  bpm: number,
  timeSig: [number, number] = [4, 4],
): Say[] {
  const msPerBeat = 60000 / bpm;
  const step = msPerBeat / 2; // 1/8 note increments
  let cursor = 0;
  return seq.map((word) => {
    if (word.beat) {
      const ms = beatToMs(word.beat, bpm, timeSig);
      if (ms !== undefined) {
        cursor = ms;
        return word;
      }
    }
    cursor += step;
    const totalBeats = cursor / msPerBeat;
    const beatsPerBar = timeSig[0];
    const bar = Math.floor(totalBeats / beatsPerBar) + 1;
    const beatWithinBar = Math.floor(totalBeats % beatsPerBar) + 1;
    const sub = Math.max(
      1,
      Math.min(4, Math.round(((cursor % msPerBeat) / (msPerBeat / 4)) || 1)),
    );
    return { ...word, beat: `@${bar}:${beatWithinBar}:${sub}` };
  });
}
