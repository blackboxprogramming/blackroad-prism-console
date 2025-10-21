const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { context } = require('@opentelemetry/api');
const { context, trace } = require('@opentelemetry/api');
const { getConfig, refreshConfig } = require('./config');
const { writeAudit } = require('./logger');
const { globalSwitchGuard } = require('./middleware/globalSwitch');
const { rateLimitGuard } = require('./middleware/rateLimit');
const healthRoutes = require('./routes/health');
const secretsRoutes = require('./routes/secrets');
const { reset: resetTokenValidator } = require('./services/tokenValidator');
const { initializeObservability, currentTraceIds } = require('./observability');
const { snapshot: metricsSnapshot } = require('./metrics');

const app = express();

initializeObservability();

app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(morgan('combined'));

function getActiveTraceId() {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  return spanContext?.traceId;
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const activeContext = context.active();
  const ids = currentTraceIds(activeContext);
  if (ids.traceId) {
    res.setHeader('X-Trace-Id', ids.traceId);
  }
  if (ids.spanId) {
    res.setHeader('X-Span-Id', ids.spanId);
  }

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const event = {
  const traceId = getActiveTraceId();
  if (traceId) {
    req.traceId = traceId;
    res.locals.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);
  }
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const resolvedTraceId = res.locals.traceId || traceId || getActiveTraceId();
    writeAudit({
      action: 'request_complete',
      path: req.originalUrl,
      method: req.method,
      status: res.statusCode,
      duration_ms: Number(end - start) / 1_000_000,
      subject: req.identity?.subject
    };
    context.with(activeContext, () => writeAudit(event));
      subject: req.identity?.subject,
      trace_id: resolvedTraceId
    });
  });
  next();
});

app.use('/health', healthRoutes);

app.get('/metrics', (_req, res) => {
  res.json({ counters: metricsSnapshot() });
});

app.use(globalSwitchGuard);
app.use(rateLimitGuard);

app.use('/secrets', secretsRoutes);

app.post('/admin/reload', (req, res) => {
  try {
    const config = refreshConfig();
    resetTokenValidator();
    writeAudit({ action: 'config_reloaded', trace_id: req.traceId });
    res.status(200).json({ message: 'Configuration reloaded', config });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reload configuration', detail: error.message });
  }
});

app.use((error, req, res, _next) => {
  writeAudit({ action: 'error', message: error.message, stack: error.stack, trace_id: req.traceId });
  res.status(500).json({ message: 'Internal server error' });
});

const config = getConfig();

app.listen(config.port, () => {
  console.log(`Autopal Express service listening on port ${config.port}`);
});

process.on('SIGHUP', () => {
  const newConfig = refreshConfig();
  resetTokenValidator();
  writeAudit({ action: 'config_reloaded_signal', config: newConfig });
});

module.exports = app;
