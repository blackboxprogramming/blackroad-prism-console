export type PrismActor =
  | 'user'
  | 'lucidia'
  | 'guardian'
  | 'kindest-coder'
  | 'roadie'
  | `agent:${string}`
  | `service:${string}`;

export type PrismMemoryDelta = {
  scope: 'short_term' | 'working' | 'long_term';
  op: 'append' | 'promote' | 'demote' | 'purge' | 'hydrate' | 'update';
  summary?: string;
  data?: Record<string, any>;
};

export type PrismEvent<T = any> = {
  id: string;
  at: string; // ISO timestamp
  actor: PrismActor;
  topic: string;
  payload: T;
  kpis?: Record<string, string | number>;
  memory_deltas?: PrismMemoryDelta[];
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

export type IntelligenceEvent = {
  id: string;
  topic: string;
  timestamp: string;
  source: string;
  channel: 'reflex' | 'prism' | 'guardian' | 'memory' | 'codex';
  payload: Record<string, any>;
  tags?: string[];
  causal?: {
    parent?: { id: string };
    chain?: string[];
  };
  meta: {
    schema: string;
    version: string;
    bridge?: Record<string, any>;
    replay?: Record<string, any>;
    annotations?: { by: string; note: string }[];
    [key: string]: unknown;
  };
};
