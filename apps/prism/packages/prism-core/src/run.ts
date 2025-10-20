import {PrismEvent} from './types';

export interface RunLifecycleOptions {
  projectId?: string;
  sessionId?: string;
  actor?: PrismEvent['actor'];
  facet?: PrismEvent['facet'];
  publish?: (event: PrismEvent) => Promise<void> | void;
  clock?: () => Date;
  eventIdFactory?: () => string;
  runIdFactory?: () => string;
}

export interface StartRunOptions {
  summary: string;
  actor?: PrismEvent['actor'];
  facet?: PrismEvent['facet'];
  ctx?: Record<string, any>;
  runId?: string;
}

export interface EndRunOptions {
  summary?: string;
  actor?: PrismEvent['actor'];
  facet?: PrismEvent['facet'];
  status?: 'ok' | 'error' | 'cancelled';
  ctx?: Record<string, any>;
}

export interface RunHandle {
  runId: string;
  event: PrismEvent;
}

export interface RunContext {
  runId: string;
  emit(event: PrismEvent): Promise<void>;
}

export interface RunLifecycle {
  startRun(options: StartRunOptions): Promise<RunHandle>;
  endRun(runId: string, options?: EndRunOptions): Promise<PrismEvent>;
  failRun(runId: string, error: unknown, options?: EndRunOptions): Promise<PrismEvent>;
  withRun<T>(options: StartRunOptions, fn: (ctx: RunContext) => Promise<T> | T, endOptions?: EndRunOptions): Promise<T>;
}

type RunState = {
  runId: string;
  summary: string;
  actor: PrismEvent['actor'];
  facet: PrismEvent['facet'];
  startTs: string;
  ctx?: Record<string, any>;
};

const DEFAULT_ACTOR: PrismEvent['actor'] = 'lucidia';
const DEFAULT_FACET: PrismEvent['facet'] = 'intent';

const defaultId = () => {
  const cryptoApi = (globalThis as any).crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') {
    return {message: error};
  }
  try {
    return {message: JSON.stringify(error)};
  } catch {
    return {message: String(error)};
  }
};

function cloneCtx(ctx?: Record<string, any>) {
  return ctx ? {...ctx} : undefined;
}

export function createRunLifecycle(options: RunLifecycleOptions = {}): RunLifecycle {
  const clock = options.clock ?? (() => new Date());
  const projectId = options.projectId ?? 'unknown-project';
  const sessionId = options.sessionId ?? 'unknown-session';
  const baseActor = options.actor ?? DEFAULT_ACTOR;
  const baseFacet = options.facet ?? DEFAULT_FACET;
  const publish = async (event: PrismEvent) => {
    if (options.publish) {
      await options.publish(event);
    }
  };
  const nextEventId = options.eventIdFactory ?? defaultId;
  const nextRunId = options.runIdFactory ?? defaultId;
  const runs = new Map<string, RunState>();

  const createEvent = (
    kind: PrismEvent['kind'],
    summary: string,
    actor: PrismEvent['actor'],
    facet: PrismEvent['facet'],
    ctx?: Record<string, any>,
    ts?: string
  ): PrismEvent => ({
    id: nextEventId(),
    ts: ts ?? clock().toISOString(),
    actor,
    kind,
    projectId,
    sessionId,
    facet,
    summary,
    ctx: ctx ? {...ctx} : undefined,
  });

  const ensureRun = (runId: string): RunState => {
    const run = runs.get(runId);
    if (!run) {
      throw new Error(`Unknown run: ${runId}`);
    }
    return run;
  };

  const startRun = async ({summary, actor, facet, ctx, runId}: StartRunOptions): Promise<RunHandle> => {
    const resolvedRunId = runId ?? nextRunId();
    if (runs.has(resolvedRunId)) {
      throw new Error(`Run ${resolvedRunId} already exists`);
    }
    const effectiveActor = actor ?? baseActor;
    const effectiveFacet = facet ?? baseFacet;
    const startTs = clock().toISOString();
    const event = createEvent('run.start', summary, effectiveActor, effectiveFacet, {
      ...(ctx ? {...ctx} : {}),
      runId: resolvedRunId,
      status: 'running',
    }, startTs);
    runs.set(resolvedRunId, {
      runId: resolvedRunId,
      summary,
      actor: effectiveActor,
      facet: effectiveFacet,
      startTs,
      ctx: cloneCtx(ctx),
    });
    await publish(event);
    return {runId: resolvedRunId, event};
  };

  const endRun = async (runId: string, options?: EndRunOptions): Promise<PrismEvent> => {
    const run = ensureRun(runId);
    const effectiveActor = options?.actor ?? run.actor;
    const effectiveFacet = options?.facet ?? run.facet;
    const status = options?.status ?? 'ok';
    const endTs = clock().toISOString();
    const ctx = {
      ...(run.ctx ? {...run.ctx} : {}),
      ...(options?.ctx ? {...options.ctx} : {}),
      runId,
      status,
      durationMs: Date.parse(endTs) - Date.parse(run.startTs),
    };
    const summary = options?.summary ?? run.summary;
    const event = createEvent('run.end', summary, effectiveActor, effectiveFacet, ctx, endTs);
    runs.delete(runId);
    await publish(event);
    return event;
  };

  const failRun = async (runId: string, error: unknown, options?: EndRunOptions): Promise<PrismEvent> => {
    const run = ensureRun(runId);
    const status = options?.status ?? 'error';
    const endTs = clock().toISOString();
    const ctx = {
      ...(run.ctx ? {...run.ctx} : {}),
      ...(options?.ctx ? {...options.ctx} : {}),
      runId,
      status,
      error: serializeError(error),
      durationMs: Date.parse(endTs) - Date.parse(run.startTs),
    };
    const summary = options?.summary ?? run.summary;
    const event = createEvent(
      'run.end',
      summary,
      options?.actor ?? run.actor,
      options?.facet ?? run.facet,
      ctx,
      endTs
    );
    runs.delete(runId);
    await publish(event);
    return event;
  };

  const withRun = async <T>(
    options: StartRunOptions,
    fn: (ctx: RunContext) => Promise<T> | T,
    endOptions?: EndRunOptions
  ): Promise<T> => {
    const {runId} = await startRun(options);
    const context: RunContext = {
      runId,
      emit: async (event) => {
        await publish({
          ...event,
          projectId: event.projectId ?? projectId,
          sessionId: event.sessionId ?? sessionId,
          ctx: {
            ...(event.ctx ?? {}),
            runId,
          },
        });
      },
    };
    try {
      const result = await fn(context);
      await endRun(runId, endOptions);
      return result;
    } catch (err) {
      await failRun(runId, err);
      throw err;
    }
  };

  return {
    startRun,
    endRun,
    failRun,
    withRun,
  };
}
