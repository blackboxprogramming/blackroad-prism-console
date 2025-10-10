const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  serviceName: 'autopal-express',
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start().catch((error) => {
  console.error('Failed to start OpenTelemetry SDK', error);
});

function shutdown() {
  sdk
    .shutdown()
    .catch((error) => {
      console.error('Error shutting down OpenTelemetry SDK', error);
    })
    .finally(() => {
      process.exit(0);
    });
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
