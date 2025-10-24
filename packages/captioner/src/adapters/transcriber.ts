import { AudioSegment, TranscriptChunk } from '../types';

export interface TranscriberOptions {
  lang?: string;
}

export interface Transcriber {
  name(): string;
  transcribe(segment: AudioSegment, options?: TranscriberOptions): Promise<TranscriptChunk[]>;
}
