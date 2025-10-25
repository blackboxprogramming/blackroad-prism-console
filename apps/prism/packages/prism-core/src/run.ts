import {PrismActor, PrismEvent, PrismMemoryDelta} from './types';

export interface RunLifecycleOptions {
  projectId?: string;
  sessionId?: string;
  actor?: PrismActor;
  publish?: (event: PrismEvent) => Promise<void> | void;
  clock?: () => Date;
  eventIdFactory?: () => string;
  runIdFactory?: () => string;
}

export interface StartRunOptions {
  summary: string;
  actor?: PrismActor;
  ctx?: Record<string, any>;
  runId?: string;
}

export interface EndRunOptions {
  summary?: string;
  actor?: PrismActor;
  status?: 'ok' | 'error' | 'cancelled';
  ctx?: Record<string, any>;
}

export interface RunHandle {
  runId: string;
  event: PrismEvent;
}

export interface RunContextEvent {
  topic: string;
  payload: Record<string, any>;
  actor?: PrismActor;
  at?: string;
  kpis?: Record<string, string | number>;
  memory_deltas?: PrismMemoryDelta[];
}

export interface RunContext {
  runId: string;
  emit(event: RunContextEvent): Promise<void>;
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
  actor: PrismActor;
  startTs: string;
  ctx?: Record<string, any>;
};

const DEFAULT_ACTOR: PrismActor = 'lucidia';

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
  const publish = async (event: PrismEvent) => {
    if (options.publish) {
      await options.publish(event);
    }
  };
  const nextEventId = options.eventIdFactory ?? defaultId;
  const nextRunId = options.runIdFactory ?? defaultId;
  const runs = new Map<string, RunState>();

  const createEvent = (
    topic: string,
    actor: PrismActor,
    payload: Record<string, any>,
    at?: string,
    extras?: Pick<PrismEvent, 'kpis' | 'memory_deltas'>
  ): PrismEvent => {
    const basePayload = {
      projectId,
      sessionId,
      ...payload,
    };
    const event: PrismEvent = {
      id: nextEventId(),
      at: at ?? clock().toISOString(),
      actor,
      topic,
      payload: {...basePayload},
    };
    if (extras?.kpis) {
      event.kpis = {...extras.kpis};
    }
    if (extras?.memory_deltas) {
      event.memory_deltas = extras.memory_deltas.map((delta) => ({...delta}));
    }
    return event;
  };

  const ensureRun = (runId: string): RunState => {
    const run = runs.get(runId);
    if (!run) {
      throw new Error(`Unknown run: ${runId}`);
    }
    return run;
  };

  const startRun = async ({summary, actor, ctx, runId}: StartRunOptions): Promise<RunHandle> => {
    const resolvedRunId = runId ?? nextRunId();
    if (runs.has(resolvedRunId)) {
      throw new Error(`Run ${resolvedRunId} already exists`);
    }
    const effectiveActor = actor ?? baseActor;
    const startTs = clock().toISOString();
    const event = createEvent(
      'actions.run.start',
      effectiveActor,
      {
        summary,
        runId: resolvedRunId,
        status: 'running',
        ctx: ctx ? {...ctx} : undefined,
      },
      startTs
    );
    runs.set(resolvedRunId, {
      runId: resolvedRunId,
      summary,
      actor: effectiveActor,
      startTs,
      ctx: cloneCtx(ctx),
    });
    await publish(event);
    return {runId: resolvedRunId, event};
  };

  const endRun = async (runId: string, options?: EndRunOptions): Promise<PrismEvent> => {
    const run = ensureRun(runId);
    const effectiveActor = options?.actor ?? run.actor;
    const status = options?.status ?? 'ok';
    const endTs = clock().toISOString();
    const summary = options?.summary ?? run.summary;
    const payload = {
      summary,
      runId,
      status,
      durationMs: Date.parse(endTs) - Date.parse(run.startTs),
      ctx: {
        ...(run.ctx ? {...run.ctx} : {}),
        ...(options?.ctx ? {...options.ctx} : {}),
      },
    };
    const event = createEvent('actions.run.end', effectiveActor, payload, endTs);
    runs.delete(runId);
    await publish(event);
    return event;
  };

  const failRun = async (runId: string, error: unknown, options?: EndRunOptions): Promise<PrismEvent> => {
    const run = ensureRun(runId);
    const status = options?.status ?? 'error';
    const endTs = clock().toISOString();
    const summary = options?.summary ?? run.summary;
    const payload = {
      summary,
      runId,
      status,
      error: serializeError(error),
      durationMs: Date.parse(endTs) - Date.parse(run.startTs),
      ctx: {
        ...(run.ctx ? {...run.ctx} : {}),
        ...(options?.ctx ? {...options.ctx} : {}),
      },
    };
    const event = createEvent('actions.run.end', options?.actor ?? run.actor, payload, endTs);
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
      emit: async ({topic, payload, actor, at, kpis, memory_deltas}) => {
        const event = createEvent(
          topic,
          actor ?? runs.get(runId)?.actor ?? baseActor,
          {
            ...payload,
            runId,
          },
          at,
          {
            kpis,
            memory_deltas,
          }
        );
        await publish(event);
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
