export type CaptionBackend = 'local' | 'provider';

export type CaptionJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export interface AudioSource {
  uri: string;
  durationSeconds?: number;
  language?: string;
}

export interface AudioSegment {
  id: string;
  start: number;
  end: number;
  sourceUri: string;
}

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptChunk {
  start: number;
  end: number;
  words: TranscriptWord[];
  text: string;
}

export interface CaptionArtifact {
  kind: 'srt' | 'vtt' | 'json';
  path: string;
  bytes: number;
}

export interface CaptionJobRecord {
  id: string;
  assetId: string;
  backend: CaptionBackend;
  status: CaptionJobStatus;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  artifacts: CaptionArtifact[];
}

export interface FormatterOptions {
  maxCharsPerLine?: number;
  maxLinesPerCue?: number;
}

export interface CaptionFormatter {
  format(chunks: TranscriptChunk[], options?: FormatterOptions): string;
  extension: string;
}
