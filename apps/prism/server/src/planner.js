import { normalizePerformanceRequest } from './performanceSchema.js';
import { computeStartMs, estimateWordDurationMs, paceToRate, pitchToString, breakForEmphasis } from './utils/beatMath.js';
import { buildSSML } from './ssml.js';
import { synthesize } from './services/tts.js';

export async function planPerformance(rawRequest) {
  const normalized = normalizePerformanceRequest(rawRequest);
  const beatDurationMs = 60000 / normalized.bpm;
  const sequence = normalized.sequence.map((entry) => {
    const startMs = computeStartMs({
      beat: entry.beat,
      bpm: normalized.bpm,
      beatsPerBar: normalized.time.beatsPerBar,
      beatUnit: normalized.time.beatUnit,
      quantStepsPerBeat: normalized.quant.stepsPerBeat
    });
    const durationMs = estimateWordDurationMs(entry.text, entry.pace);
    const breakMs = breakForEmphasis(entry.emphasis);
    const highlightMs = breakMs ? durationMs + breakMs : durationMs;
    const shouldDuck = entry.overlay && entry.overlay.includes('glow');
    return {
      text: entry.text,
      beat: entry.beat,
      pace: entry.pace,
      emphasis: entry.emphasis,
      pitch: entry.pitch,
      ratePercent: paceToRate(entry.pace),
      pitchLabel: pitchToString(entry.pitch),
      startMs,
      durationMs,
      breakMs,
      highlightMs,
      overlay: entry.overlay,
      gesture: entry.gesture,
      duckDb: shouldDuck ? -2.5 : 0
    };
  });

  const postEvents = normalized.postEvents.map((event) => {
    const startMs = event.beat
      ? computeStartMs({
          beat: event.beat,
          bpm: normalized.bpm,
          beatsPerBar: normalized.time.beatsPerBar,
          beatUnit: normalized.time.beatUnit,
          quantStepsPerBeat: normalized.quant.stepsPerBeat
        })
      : null;
    return {
      type: event.type,
      payload: event.payload,
      overlay: event.overlay,
      durationMs: event.durationMs,
      startMs
    };
  });

  const ssml = buildSSML({
    voice: normalized.voice,
    sequence: normalized.sequence
  });
  const tts = await synthesize({ ssml, voice: normalized.voice });

  const captionEvents = sequence.map((segment) => ({
    word: segment.text,
    startMs: segment.startMs,
    durMs: segment.highlightMs,
    overlay: segment.overlay ?? undefined
  }));

  const gestureEvents = sequence
    .filter((segment) => Boolean(segment.gesture))
    .map((segment) => ({
      name: segment.gesture,
      startMs: segment.startMs,
      beat: segment.beat
    }));

  postEvents.forEach((event) => {
    if (event.overlay) {
      captionEvents.push({
        word: event.overlay,
        startMs: event.startMs ?? null,
        durMs: event.durationMs ?? Math.round(beatDurationMs),
        overlay: event.overlay,
        action: 'overlay'
      });
    }
  });

  const estimatedDurationMs = Math.max(
    ...[
      sequence.reduce((max, segment) => Math.max(max, segment.startMs + segment.highlightMs), 0),
      postEvents.reduce(
        (max, event) => Math.max(max, (event.startMs ?? 0) + (event.durationMs ?? 0)),
        0
      )
    ]
  );

  return {
    meta: {
      bpm: normalized.bpm,
      time: normalized.time,
      quant: normalized.quant,
      voice: normalized.voice,
      swing: normalized.swing,
      key: normalized.key,
      beatDurationMs,
      estimatedDurationMs
    },
    ssml,
    tts,
    sequence,
    postEvents,
    obs: {
      captions: captionEvents,
      gestures: gestureEvents
    }
  };
}
