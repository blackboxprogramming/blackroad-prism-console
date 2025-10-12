import { ValidationError } from '../errors.js';

const FRACTION_RE = /^(\d+)\/(\d+)$/;
const BEAT_RE = /^@(\d+):(\d+)(?::(\d+))?$/;

export function parseFraction(value, label) {
  if (typeof value !== 'string' || !FRACTION_RE.test(value)) {
    throw new ValidationError(`${label} must be a string fraction like '4/4'`);
  }
  const [, numStr, denStr] = value.match(FRACTION_RE);
  const numerator = Number.parseInt(numStr, 10);
  const denominator = Number.parseInt(denStr, 10);
  if (denominator === 0) {
    throw new ValidationError(`${label} denominator must be greater than 0`);
  }
  return { numerator, denominator };
}

export function parseBeat(value) {
  if (typeof value !== 'string' || !BEAT_RE.test(value)) {
    throw new ValidationError(`beat must follow '@bar:beat:step' format`);
  }
  const [, barStr, beatStr, stepStr] = value.match(BEAT_RE);
  const bar = Number.parseInt(barStr, 10);
  const beat = Number.parseInt(beatStr, 10);
  const step = stepStr ? Number.parseInt(stepStr, 10) : 1;
  if (bar < 1 || beat < 1 || step < 1) {
    throw new ValidationError(`beat indices must be >= 1`);
  }
  return { bar, beat, step };
}

export function computeStartMs({
  beat,
  bpm,
  beatsPerBar,
  beatUnit,
  quantStepsPerBeat
}) {
  const beatDurationMs = 60000 / bpm;
  const { bar, beat: beatIndex, step } = beat;
  const zeroBar = bar - 1;
  const zeroBeat = beatIndex - 1;
  const zeroStep = step - 1;
  const beatsFromBars = zeroBar * beatsPerBar;
  const beatsFromBeat = zeroBeat;
  const subdivision = quantStepsPerBeat > 0 ? zeroStep / quantStepsPerBeat : 0;
  const totalBeats = beatsFromBars + beatsFromBeat + subdivision;
  return Math.round(totalBeats * beatDurationMs);
}

export function estimateWordDurationMs(text, pace, base = 260) {
  const normalized = (typeof text === 'string' ? text : '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const vowelGroups = normalized.match(/[aeiouy]+/g);
  let syllables = vowelGroups ? vowelGroups.length : 1;
  if (normalized.endsWith('e') && syllables > 1) {
    syllables -= 1;
  }
  const syllableWeight = Math.max(syllables, 1);
  const paceFactor = pace && pace > 0 ? pace : 1;
  const duration = (base + (syllableWeight - 1) * 90) / paceFactor;
  return Math.round(Math.max(duration, 120));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function pitchToString(pitch) {
  const rounded = Math.round(pitch ?? 0);
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded}st`;
}

export function paceToRate(pace) {
  const percent = Math.round((pace ?? 1) * 100);
  return clamp(percent, 75, 125);
}

export function breakForEmphasis(emphasis) {
  if (!emphasis || emphasis < 0.2) {
    return null;
  }
  const weighted = Math.min(Math.max(emphasis, 0), 1);
  const breakMs = Math.round(100 + weighted * 60);
  return clamp(breakMs, 100, 180);
}

export function escapeSSML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
