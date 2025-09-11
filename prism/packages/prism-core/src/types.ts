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
