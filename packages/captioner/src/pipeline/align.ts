import { AudioSegment, TranscriptChunk } from '../types';

export interface AlignmentResult {
  segment: AudioSegment;
  chunks: TranscriptChunk[];
}

export function align(segments: AudioSegment[], transcripts: TranscriptChunk[][]): AlignmentResult[] {
  return segments.map((segment, index) => ({
    segment,
    chunks: transcripts[index] ?? []
  }));
}
