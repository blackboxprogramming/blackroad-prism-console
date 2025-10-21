const fs = require('fs');
const path = require('path');
const { context, trace } = require('@opentelemetry/api');

const { getConfig } = require('./config');
const { recordAuditMetric } = require('./observability');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function currentTraceFields() {
  const span = trace.getSpan(context.active());
  if (!span) {
    return {};
  }
  const spanContext = span.spanContext();
  if (!spanContext || !spanContext.traceId || spanContext.traceId === '00000000000000000000000000000000') {
    return {};
  }
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
function resolveTraceId(explicitTraceId) {
  if (explicitTraceId) {
    return explicitTraceId;
  }
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  return spanContext?.traceId;
}

function writeAudit(event) {
  const config = getConfig();
  const traceId = resolveTraceId(event.trace_id);
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
    ...currentTraceFields(),
  };
  if (traceId) {
    payload.trace_id = traceId;
  } else if ('trace_id' in payload && payload.trace_id == null) {
    delete payload.trace_id;
  }
  const serialized = JSON.stringify(payload);
  const logPath = path.resolve(config.auditLogPath);
  ensureDir(logPath);
  recordAuditMetric(payload);
  fs.appendFile(logPath, `${serialized}\n`, (error) => {
    if (error) {
      console.error('Failed to write audit log entry', error);
    }
  });
}

module.exports = {
  writeAudit
};
