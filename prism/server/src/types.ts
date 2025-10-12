export type QuantDivision = '1/8' | '1/16' | '1/32';

export interface Say {
  t: string;
  pace?: number;
  emph?: number;
  pitch?: number;
  overlay?: string;
  beat?: string;
  at?: number;
}

export interface ScheduledWord {
  word: Say;
  offset: number;
  durationMs: number;
}

export interface SessionState {
  bpm: number;
  paceBias: number;
  theme: string;
  quantDiv: QuantDivision;
  humanize: number;
  timeSig: [number, number];
  barLock: boolean;
}

export interface BroadcastMessage {
  type: string;
  [key: string]: unknown;
}
