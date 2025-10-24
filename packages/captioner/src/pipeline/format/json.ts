import { TranscriptChunk } from '../../types';

export function toJSON(chunks: TranscriptChunk[]): string {
  const serialisable = chunks.map((chunk) => ({
    start: chunk.start,
    end: chunk.end,
    text: chunk.text,
    words: chunk.words.map((word) => ({
      text: word.text,
      start: word.start,
      end: word.end,
      confidence: word.confidence
    }))
  }));
  return JSON.stringify(serialisable, null, 2);
}

export default toJSON;
