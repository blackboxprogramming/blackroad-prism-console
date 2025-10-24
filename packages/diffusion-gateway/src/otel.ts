import { context, trace } from '@opentelemetry/api';

export async function withSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const tracer = trace.getTracer('diffusion-gateway');
  const span = tracer.startSpan(name);
  return await context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.end();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      span.end();
      throw error;
    }
  });
}
