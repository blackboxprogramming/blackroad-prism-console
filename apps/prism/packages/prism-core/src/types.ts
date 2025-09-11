export type PrismEvent = {
  id: string;
  ts: string;                       // ISO
  actor: 'user'|'lucidia'|`agent:${string}`;
  kind:
    | 'prompt'|'plan'
    | 'file.write'|'file.diff'
    | 'run.start'|'run.end'
    | 'test.start'|'test.end'
    | 'deploy.start'|'deploy.end'
    | 'net.req'|'net.res'
    | 'graph.update'
    | 'error'|'warn';
  projectId: string;
  sessionId: string;
  facet: 'time'|'space'|'intent';
  summary: string;
  ctx?: Record<string, any>;
};

export type PrismSpan = {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTs: string;
  endTs?: string;
  status: 'ok'|'error'|'cancelled';
  attrs?: Record<string, any>;   // model, tokens, cmd, env, cost…
  links?: string[];              // event ids
};

export type PrismDiff = {
  path: string;
  beforeSha: string;
  afterSha: string;
  patch: string;                 // unified diff
  testsPredicted?: string[];
};

export type Capability =
  | 'read'|'write'|'exec'|'net'|'secrets'|'dns'|'deploy';

export type Policy = {
  mode: 'playground'|'dev'|'trusted'|'prod';
  approvals: Partial<Record<Capability, 'auto'|'review'|'forbid'>>;
};
