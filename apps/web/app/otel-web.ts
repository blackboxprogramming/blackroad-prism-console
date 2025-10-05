'use client';

import { context, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

let provider: WebTracerProvider | undefined;

const getEndpoint = (path: string) => {
  const base = process.env.NEXT_PUBLIC_OTLP_HTTP ?? '/otlp';
  return `${base.replace(/\/$/, '')}${path}`;
};

export function registerOTel() {
  if (provider) {
    return;
  }

  provider = new WebTracerProvider();
  const exporter = new OTLPTraceExporter({ url: getEndpoint('/v1/traces') });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  // Expose helpers for console debugging if needed.
  (window as typeof window & {
    __OTEL_ACTIVE_TRACE?: () => { traceId: string; spanId: string } | undefined;
  }).__OTEL_ACTIVE_TRACE = () => {
    const span = trace.getSpan(context.active());
    const spanContext = span?.spanContext();
    if (!spanContext) return undefined;
    return { traceId: spanContext.traceId, spanId: spanContext.spanId };
  };
}
