import crypto from 'crypto';
import { AudioSegment, TranscriptChunk, TranscriptWord } from '../types';
import { Transcriber, TranscriberOptions } from './transcriber';

function capitalize(text: string): string {
  if (!text) {
    return text;
  }
  return text[0].toUpperCase() + text.slice(1);
}

function deterministicConfidence(input: string): number {
  const hash = crypto.createHash('sha1').update(input).digest();
  return Math.round((hash[0] / 255) * 1000) / 1000;
}

export class LocalTranscriber implements Transcriber {
  constructor(private readonly seed: string = 'captioner-local') {}

  name(): string {
    return 'local';
  }

  async transcribe(segment: AudioSegment, options: TranscriberOptions = {}): Promise<TranscriptChunk[]> {
    const words = segment.id
      .split(/[-_]/)
      .filter(Boolean)
      .map((word, index) => this.createWord(word, segment.start + index * 0.4));

    const text = capitalize(words.map((word) => word.text).join(' '));

    return [
      {
        start: segment.start,
        end: Math.max(segment.end, segment.start + words.length * 0.4),
        words,
        text: options.lang ? `${text} (${options.lang})` : text
      }
    ];
  }

  private createWord(raw: string, start: number): TranscriptWord {
    const normalized = raw.toLowerCase();
    const confidence = deterministicConfidence(`${this.seed}:${raw}`);
    const end = start + 0.4;

    return {
      text: normalized,
      start,
      end,
      confidence
    };
  }
}

export default LocalTranscriber;
