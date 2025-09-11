export interface PrismDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface PrismDiff {
  path: string;
  hunks: PrismDiffHunk[];
}

export interface RunRecord {
  id: string;
  projectId: string;
  sessionId: string;
  cmd: string;
  cwd?: string;
  status: 'running' | 'ok' | 'error' | 'cancelled';
  exitCode?: number | null;
  startedAt: string;
  endedAt?: string;
}

export interface ApprovalRecord {
  id: string;
  capability: string;
  status: 'pending' | 'approved' | 'denied';
  payload: unknown;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}

export interface PrismEvent<T = any> {
  id: string;
  kind: string;
  data: T;
}
