import { breakForEmphasis, escapeSSML, paceToRate, pitchToString } from './utils/beatMath.js';

export function buildSSML(plan) {
  const chunks = plan.sequence.map((segment) => {
    const rate = paceToRate(segment.pace);
    const pitch = pitchToString(segment.pitch);
    const text = escapeSSML(segment.text);
    let chunk = `<prosody rate="${rate}%" pitch="${pitch}">${text}</prosody>`;
    const breakMs = breakForEmphasis(segment.emphasis);
    if (breakMs) {
      chunk += `<break time="${breakMs}ms"/>`;
    }
    return chunk;
  });
  return `<speak><voice name="${escapeSSML(plan.voice)}">${chunks.join('')}</voice></speak>`;
}
