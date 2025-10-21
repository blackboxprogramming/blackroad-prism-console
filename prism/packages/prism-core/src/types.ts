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
export type PrismEvent = {
  id: string;
  ts: string;
  actor: 'user' | 'lucidia' | `agent:${string}`;
  kind: 'prompt' | 'plan' | 'file.write' | 'file.diff' | 'run.start' | 'run.end' | 'test.start' | 'test.end' | 'deploy.start' | 'deploy.end' | 'net.req' | 'net.res' | 'graph.update' | 'error' | 'warn';
  projectId: string;
  sessionId: string;
  facet: 'time' | 'space' | 'intent';
  summary: string;
  ctx?: Record<string, any>;
};

export type PrismDiff = {
  path: string;
  beforeSha: string;
  afterSha: string;
  patch: string;
  testsPredicted?: string[];
};

export type Policy = {
  mode: 'playground' | 'dev' | 'trusted' | 'prod';
  approvals: Partial<Record<'read' | 'write' | 'exec' | 'net' | 'secrets' | 'dns' | 'deploy', 'auto' | 'review' | 'forbid'>>;
};
