const { context, trace, metrics } = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { ConsoleMetricExporter, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

const pkg = require('../package.json');

let sdkPromise;
let auditCounter;
let durationHistogram;

function normalizeEndpoint(endpoint) {
  return endpoint.replace(/\/+$/, '');
}

function buildTraceExporter(endpoint) {
  if (!endpoint) {
    return new ConsoleSpanExporter();
  }
  return new OTLPTraceExporter({ url: `${normalizeEndpoint(endpoint)}/v1/traces` });
}

function buildMetricReader(endpoint) {
  const exporter = endpoint
    ? new OTLPMetricExporter({ url: `${normalizeEndpoint(endpoint)}/v1/metrics` })
    : new ConsoleMetricExporter();
  return new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: Number(process.env.AUTOPAL_METRICS_INTERVAL_MS || 60000),
  });
}

function initializeObservability() {
  if (sdkPromise) {
    return sdkPromise;
  }

  const consoleExporters = String(process.env.AUTOPAL_ENABLE_CONSOLE_EXPORTERS || 'false').toLowerCase();
  const consoleRequested = ['1', 'true', 'yes'].includes(consoleExporters);
  const defaultOtlp = String(process.env.AUTOPAL_ENABLE_DEFAULT_OTLP || 'false').toLowerCase();
  const defaultEnabled = ['1', 'true', 'yes'].includes(defaultOtlp);

  let endpoint = process.env.AUTOPAL_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || null;
  if (!endpoint && !consoleRequested && defaultEnabled) {
    endpoint = 'http://localhost:4318';
  }
  if (consoleRequested) {
    endpoint = null;
  }
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.AUTOPAL_SERVICE_NAME || 'autopal-express',
    [SemanticResourceAttributes.SERVICE_VERSION]: pkg.version,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  });

  const traceExporter = buildTraceExporter(endpoint);
  const metricReader = buildMetricReader(endpoint);

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
      }),
    ],
  });

  sdkPromise = sdk.start().then(() => {
    const meter = metrics.getMeter('autopal-express');
    auditCounter = meter.createCounter('autopal.audit.events_total', {
      description: 'Number of audit events emitted by Autopal Express',
    });
    durationHistogram = meter.createHistogram('autopal.http.server.duration', {
      description: 'Autopal Express HTTP request durations',
      unit: 'ms',
    });

    process.on('SIGTERM', () => {
      sdk.shutdown().then(() => process.exit(0)).catch((error) => {
        console.error('Failed to shutdown OpenTelemetry SDK', error);
        process.exit(1);
      });
    });
  }).catch((error) => {
    console.error('Failed to initialise OpenTelemetry', error);
  });

  return sdkPromise;
}

function recordAuditMetric(event) {
  if (auditCounter) {
    auditCounter.add(1, {
      action: event.action || 'unknown',
      status: String(event.status ?? ''),
    });
  }

  if (durationHistogram && typeof event.duration_ms === 'number') {
    durationHistogram.record(event.duration_ms, {
      path: event.path || 'unknown',
      method: event.method || 'unknown',
      status: String(event.status ?? ''),
    });
  }
}

function currentTraceIds(activeContext = context.active()) {
  const span = trace.getSpan(activeContext);
  if (!span) {
    return {};
  }
  const spanContext = span.spanContext();
  if (!spanContext || !spanContext.traceId || spanContext.traceId === '00000000000000000000000000000000') {
    return {};
  }

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

module.exports = {
  initializeObservability,
  recordAuditMetric,
  currentTraceIds,
  buildTraceExporter,
  buildMetricReader,
};
