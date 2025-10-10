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
}

function writeAudit(event) {
  const config = getConfig();
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
    ...currentTraceFields(),
  };
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
