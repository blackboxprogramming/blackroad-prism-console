import type { Say } from './types.js';

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function emphasisLevel(value: number) {
  if (value <= -0.25) return 'reduced';
  if (value >= 0.6) return 'strong';
  if (value >= 0.3) return 'moderate';
  if (value > 0) return 'moderate';
  return 'none';
}

export function toSSML(seq: Say[], paceBias = 1) {
  const parts = seq.map((word) => {
    const rate = Math.max(0.5, Math.min(2, (word.pace ?? 1) * paceBias));
    const pitch = word.pitch
      ? ` pitch="${word.pitch >= 0 ? '+' : ''}${word.pitch}st"`
      : '';
    const payload = `<prosody rate="${Math.round(rate * 100)}%"${pitch}>${escapeXml(word.t)}</prosody>`;
    if (word.emph && Math.abs(word.emph) > 0.01) {
      const level = emphasisLevel(word.emph);
      if (level !== 'none') {
        return `<emphasis level="${level}">${payload}</emphasis>`;
      }
    }
    return payload;
  });
  return `<speak>${parts.join(' ')}</speak>`;
}
