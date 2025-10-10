import { ValidationError } from './errors.js';
import { parseFraction, parseBeat } from './utils/beatMath.js';

function ensureNumber(value, label) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`${label} must be a number`);
  }
  return value;
}

function ensureString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError(`${label} must be a non-empty string`);
  }
  return value;
}

function normalizeSequenceItem(item, index) {
  if (typeof item !== 'object' || item === null) {
    throw new ValidationError(`seq[${index}] must be an object`);
  }
  const text = ensureString(item.t ?? item.text, `seq[${index}].t`);
  const pace = item.pace === undefined ? 1 : ensureNumber(item.pace, `seq[${index}].pace`);
  const emphasis = item.emph === undefined ? 0 : ensureNumber(item.emph, `seq[${index}].emph`);
  const pitch = item.pitch === undefined ? 0 : ensureNumber(item.pitch, `seq[${index}].pitch`);
  const beat = parseBeat(ensureString(item.beat, `seq[${index}].beat`));
  const overlay = item.overlay ? String(item.overlay) : null;
  const gesture = item.gesture ? String(item.gesture) : null;
  return {
    text,
    pace,
    emphasis,
    pitch,
    beat,
    overlay,
    gesture
  };
}

function normalizePostItem(item, index) {
  if (typeof item !== 'object' || item === null) {
    throw new ValidationError(`post[${index}] must be an object`);
  }
  const typeRaw = item.kind ?? item.type;
  const type = ensureString(typeRaw, `post[${index}].kind`);
  const beat = item.beat ? parseBeat(String(item.beat)) : null;
  const ms = item.ms ?? item.durationMs ?? item.dur_ms ?? item.durMs ?? null;
  const durationMs = ms === null ? null : ensureNumber(ms, `post[${index}].durationMs`);
  const overlay = item.overlay ? String(item.overlay) : null;
  const payload = { ...item };
  return {
    type,
    beat,
    durationMs,
    overlay,
    payload
  };
}

export function normalizePerformanceRequest(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new ValidationError('request body must be a JSON object');
  }
  const bpm = ensureNumber(raw.bpm, 'bpm');
  if (bpm <= 0) {
    throw new ValidationError('bpm must be greater than 0');
  }
  const voice = ensureString(raw.voice ?? 'default', 'voice');
  const swing = raw.swing === undefined ? 0 : ensureNumber(raw.swing, 'swing');
  const key = raw.key ? String(raw.key) : null;
  const timeFraction = parseFraction(ensureString(raw.time, 'time signature'), 'time');
  const quantFraction = parseFraction(ensureString(raw.quant ?? '1/4', 'quant'), 'quant');
  const beatsPerBar = timeFraction.numerator;
  const beatUnit = timeFraction.denominator;
  const quantStepsPerBeat = quantFraction.denominator / beatUnit;
  if (quantStepsPerBeat <= 0) {
    throw new ValidationError('quant must produce a positive subdivision per beat');
  }
  const sequence = Array.isArray(raw.seq)
    ? raw.seq.map((item, idx) => normalizeSequenceItem(item, idx))
    : (() => {
        throw new ValidationError('seq must be an array');
      })();
  const postEvents = Array.isArray(raw.post ?? [])
    ? (raw.post ?? []).map((item, idx) => normalizePostItem(item, idx))
    : (() => {
        throw new ValidationError('post must be an array when provided');
      })();

  return {
    bpm,
    voice,
    swing,
    key,
    time: {
      beatsPerBar,
      beatUnit
    },
    quant: {
      fraction: quantFraction,
      stepsPerBeat: quantStepsPerBeat,
      stepsPerBar: quantStepsPerBeat * beatsPerBar
    },
    sequence,
    postEvents
  };
}
