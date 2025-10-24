import { TranscriptChunk } from '../types';

const TERMINATORS = ['.', '!', '?'];

export function punctuate(chunks: TranscriptChunk[]): TranscriptChunk[] {
  return chunks.map((chunk) => {
    const trimmed = chunk.text.trim();
    if (!trimmed) {
      return chunk;
    }

    const needsTerminator = !TERMINATORS.some((terminator) => trimmed.endsWith(terminator));
    const text = needsTerminator ? `${trimmed}.` : trimmed;
    const capitalized = text.charAt(0).toUpperCase() + text.slice(1);

    return {
      ...chunk,
      text: capitalized
    };
  });
}
