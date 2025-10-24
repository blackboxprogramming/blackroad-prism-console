import { FormatterOptions, TranscriptChunk } from '../../types';

function toTimestamp(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const secs = String(date.getUTCSeconds()).padStart(2, '0');
  const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${secs}.${millis}`;
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    return [words.join(' ')];
  }

  return lines;
}

export function toVtt(chunks: TranscriptChunk[], options: FormatterOptions = {}): string {
  const maxCharsPerLine = options.maxCharsPerLine ?? 42;
  const maxLinesPerCue = options.maxLinesPerCue ?? 2;

  const cues = chunks.map((chunk) => {
    const lines = wrapLines(chunk.text, maxCharsPerLine, maxLinesPerCue).join('\n');
    return `${toTimestamp(chunk.start)} --> ${toTimestamp(chunk.end)}\n${lines}`;
  });

  return `WEBVTT\n\n${cues.join('\n\n')}\n`;
}

export default toVtt;
