type BeatTag = {
  bar: number;
  beat: number;
  division: number;
};

export type Say = {
  t: string;
  pace: number;
  emph: number;
  pitch: number;
  beat?: string;
  overlay?: string;
  gesture?: string;
};

const BLOCK_RX = /\[([^\]]+)\]/g;
const BEAT_RX = /@(?<bar>\d+):(?<beat>\d+):(?<div>\d+)/;

const DEFAULTS = {
  pace: { min: 0.5, max: 1.5, fallback: 1.0 },
  pitch: { min: -12, max: 12, fallback: 0 },
  emph: { min: 0, max: 1, fallback: 0 },
  beatBudget: 0.35,
  beatsPerBar: 4,
  subdivisions: 4, // quarter-beat resolution (1/16 notes in 4/4)
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parseBeatTag(token: string): { cleaned: string; beat?: string } {
  const match = token.match(BEAT_RX);
  if (!match || !match.groups) {
    return { cleaned: token };
  }

  const { bar, beat, div } = match.groups;
  const beatValue = `@${Number(bar)}:${Number(beat)}:${Number(div)}`;
  const cleaned = token.replace(match[0], '');
  return { cleaned, beat: beatValue };
}

function normaliseBeat(tag: string): BeatTag | undefined {
  const match = tag.match(BEAT_RX);
  if (!match || !match.groups) return undefined;
  const bar = Number(match.groups.bar);
  const beat = Number(match.groups.beat);
  const division = Number(match.groups.div);
  if (!Number.isFinite(bar) || !Number.isFinite(beat) || !Number.isFinite(division)) {
    return undefined;
  }
  return { bar, beat, division };
}

function formatBeat({ bar, beat, division }: BeatTag): string {
  return `@${bar}:${beat}:${division}`;
}

function advanceBeat(tag: BeatTag, steps: number): BeatTag {
  const result = { ...tag };
  const { beatsPerBar, subdivisions } = DEFAULTS;

  result.division += steps;
  while (result.division > subdivisions) {
    result.division -= subdivisions;
    result.beat += 1;
  }

  while (result.beat > beatsPerBar) {
    result.beat -= beatsPerBar;
    result.bar += 1;
  }

  return result;
}

function autoFillBeats(seq: Say[]): Say[] {
  let cursor: BeatTag | undefined;
  const step = 2; // 1/8 note (two subdivisions)

  return seq.map((entry, idx) => {
    if (entry.beat) {
      const parsed = normaliseBeat(entry.beat);
      if (parsed) {
        cursor = parsed;
        return entry;
      }
      // invalid beat tag → drop and fall through to auto assignment
    }

    if (!cursor) {
      cursor = { bar: 1, beat: 1, division: 1 };
      return { ...entry, beat: formatBeat(cursor) };
    }

    const next = advanceBeat(cursor, idx === 0 ? 0 : step);
    cursor = next;
    return { ...entry, beat: formatBeat(next) };
  });
}

export function clampBudget(
  seq: Say[],
  budget = DEFAULTS.beatBudget,
  paceRange: [number, number] = [0.75, 1.25],
  pitchRange: [number, number] = [-5, 5],
): Say[] {
  let totalEmph = 0;

  const clamped = seq.map((entry) => {
    const pace = clamp(entry.pace, paceRange[0], paceRange[1]);
    const pitch = clamp(entry.pitch, pitchRange[0], pitchRange[1]);
    const emph = clamp(entry.emph, DEFAULTS.emph.min, DEFAULTS.emph.max);
    totalEmph += emph;
    return { ...entry, pace, pitch, emph };
  });

  if (totalEmph <= budget || totalEmph === 0) {
    return clamped;
  }

  const scale = budget / totalEmph;
  return clamped.map((entry) => ({ ...entry, emph: Number((entry.emph * scale).toFixed(4)) }));
}

export function computeBudgetUsage(seq: Say[]): number {
  return Number(seq.reduce((sum, entry) => sum + (entry.emph || 0), 0).toFixed(4));
}

function parseField(rawField: string, current: Say): Say {
  let field = rawField.trim();
  if (!field) return current;

  const { cleaned, beat } = parseBeatTag(field);
  if (beat && !current.beat) {
    current = { ...current, beat };
  }

  field = cleaned;

  if (field.includes('*')) {
    current = { ...current, overlay: 'harm' };
    field = field.replace('*', '');
  }

  if (field.includes('!')) {
    current = { ...current, gesture: 'microZoom' };
    field = field.replace('!', '');
  }

  const trimmed = field.trim();
  if (!trimmed) return current;

  if (/^e-?\d+(?:\.\d+)?$/i.test(trimmed)) {
    const emph = parseFloat(trimmed.slice(1));
    if (Number.isFinite(emph)) {
      return { ...current, emph };
    }
    return current;
  }

  if (/^p[+-]?\d+$/i.test(trimmed)) {
    const pitch = parseInt(trimmed.slice(1), 10);
    if (Number.isFinite(pitch)) {
      return { ...current, pitch };
    }
    return current;
  }

  if (/^p-?\d*(?:\.\d+)?$/i.test(trimmed)) {
    const pace = parseFloat(trimmed.slice(1));
    if (Number.isFinite(pace)) {
      return { ...current, pace };
    }
    return current;
  }

  return current;
}

export function parseKey(line: string): Say[] {
  if (!line) return [];

  const words: Say[] = [];
  let match: RegExpExecArray | null;
  BLOCK_RX.lastIndex = 0;
  while ((match = BLOCK_RX.exec(line)) !== null) {
    const raw = match[1];
    const segments = raw.split('|');
    if (segments.length === 0) continue;

    const wordToken = segments.shift();
    if (!wordToken) continue;
    const word = wordToken.trim();
    if (!word) continue;

    let current: Say = {
      t: word,
      pace: DEFAULTS.pace.fallback,
      emph: DEFAULTS.emph.fallback,
      pitch: DEFAULTS.pitch.fallback,
    };

    for (const segment of segments) {
      current = parseField(segment, current);
    }

    words.push(current);
  }

  const withBeats = autoFillBeats(words);
  return clampBudget(withBeats);
}

function msFromBeat(tag: string | undefined, bpm: number, beatsPerBar: number): number | undefined {
  if (!tag) return undefined;
  const parsed = normaliseBeat(tag);
  if (!parsed) return undefined;
  const subdivisionMs = 60000 / bpm / DEFAULTS.subdivisions;
  const fromBars = (parsed.bar - 1) * beatsPerBar * DEFAULTS.subdivisions;
  const fromBeats = (parsed.beat - 1) * DEFAULTS.subdivisions;
  const index = fromBars + fromBeats + (parsed.division - 1);
  return Math.round(index * subdivisionMs);
}

export function reconcileTimes(
  seq: Say[],
  tts: Record<number, number>,
  bpm: number,
  timeSig: [number, number] = [4, 4],
): number[] {
  const beatsPerBar = timeSig[0];
  const resolved: number[] = [];
  let last = 0;
  let lastGestureAt = -Infinity;

  seq.forEach((entry, index) => {
    const beatTime = msFromBeat(entry.beat, bpm, beatsPerBar);
    const ttsTime = tts[index];
    let chosen: number;

    if (ttsTime == null && beatTime == null) {
      chosen = last + 120;
    } else if (ttsTime == null) {
      chosen = beatTime!;
    } else if (beatTime == null) {
      chosen = ttsTime;
    } else {
      const delta = Math.abs(ttsTime - beatTime);
      if (delta <= 40) {
        chosen = beatTime;
      } else if (delta < 140) {
        chosen = Math.round((0.6 * ttsTime) + (0.4 * beatTime));
      } else {
        chosen = ttsTime;
      }
    }

    chosen = Math.max(chosen, last + 20);

    if (entry.gesture === 'microZoom') {
      if (chosen - lastGestureAt < 250) {
        console.warn(`gesture-spam: dropping gesture for "${entry.t}" (<250ms window)`);
        delete entry.gesture;
      } else {
        lastGestureAt = chosen;
      }
    }

    resolved.push(chosen);
    last = chosen;
  });

  return resolved;
}

export function paletteDefers(currentBar: number, targetBar: number): boolean {
  return targetBar > currentBar;
}

