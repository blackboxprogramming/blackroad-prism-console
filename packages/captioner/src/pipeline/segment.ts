import crypto from 'crypto';
import { AudioSegment, AudioSource } from '../types';

export interface SegmentOptions {
  maxDurationSeconds?: number;
}

export function segment(source: AudioSource, options: SegmentOptions = {}): AudioSegment[] {
  const maxDuration = options.maxDurationSeconds ?? 15;
  const duration = source.durationSeconds ?? maxDuration;
  const segmentCount = Math.max(1, Math.ceil(duration / maxDuration));

  const segments: AudioSegment[] = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const start = index * maxDuration;
    const end = Math.min(duration, (index + 1) * maxDuration);
    const id = crypto.createHash('sha1').update(`${source.uri}:${index}`).digest('hex').slice(0, 12);
    segments.push({ id, start, end, sourceUri: source.uri });
  }
  return segments;
}
