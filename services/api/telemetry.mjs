import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';

let sdk;

function createExporter() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (endpoint) {
    const url = `${endpoint.replace(/\/$/, '')}/v1/traces`;
    return new OTLPTraceExporter({ url });
  }
  return new ConsoleSpanExporter();
}

export function startTelemetry() {
  if (sdk) {
    return sdk;
  }

  const resource = new Resource({
    'service.name': process.env.OTEL_SERVICE_NAME ?? 'blackroad-api-bridge',
    'service.version': process.env.BUILD_SHA ?? 'dev',
  });

  sdk = new NodeSDK({
    resource,
    traceExporter: createExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start().catch((err) => {
    console.warn('[telemetry] failed to start OpenTelemetry SDK', err);
  });

  const shutdown = () => {
    sdk
      .shutdown()
      .catch((err) => console.warn('[telemetry] shutdown failed', err))
      .finally(() => process.exit(0));
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  return sdk;
}

startTelemetry();
