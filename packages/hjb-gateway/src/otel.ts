import { trace, SpanStatusCode } from '@opentelemetry/api';

export async function withSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const tracer = trace.getTracer('hjb-gateway');
  const span = tracer.startSpan(name);
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
