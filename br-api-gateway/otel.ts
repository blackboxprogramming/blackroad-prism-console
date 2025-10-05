import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes as S } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const serviceName = process.env.OTEL_SERVICE_NAME || 'br-api-gateway';

const resource = resourceFromAttributes({
  [S.SERVICE_NAME]: serviceName,
  [S.SERVICE_NAMESPACE]: 'blackroad',
  [S.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'dev'
});

const parseHeaders = () => {
  if (!process.env.OTEL_EXPORTER_OTLP_HEADERS) return {};

  try {
    return JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS);
  } catch (error) {
    console.warn('Failed to parse OTEL_EXPORTER_OTLP_HEADERS. Falling back to empty headers.', error);
    return {};
  }
};

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  headers: parseHeaders()
});

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter
});

export const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [getNodeAutoInstrumentations()]
});
