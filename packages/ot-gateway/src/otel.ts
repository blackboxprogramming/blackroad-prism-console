export type SpanOptions = {
  name: string;
  attributes?: Record<string, unknown>;
};

type AsyncFn<T> = () => Promise<T>;

type SyncOrAsync<T> = () => T | Promise<T>;

export async function withSpan<T>(options: SpanOptions, fn: SyncOrAsync<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    if (process.env.OT_GATEWAY_TRACE === '1') {
      // eslint-disable-next-line no-console
      console.log(`[span] ${options.name} (${duration}ms)`, options.attributes || {});
    }
  }
}
