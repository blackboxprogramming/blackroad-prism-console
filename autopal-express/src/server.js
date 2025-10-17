const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { getConfig, refreshConfig } = require('./config');
const { writeAudit } = require('./logger');
const { globalSwitchGuard } = require('./middleware/globalSwitch');
const { rateLimitGuard } = require('./middleware/rateLimit');
const healthRoutes = require('./routes/health');
const secretsRoutes = require('./routes/secrets');
const { reset: resetTokenValidator } = require('./services/tokenValidator');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(morgan('combined'));

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    writeAudit({
      action: 'request_complete',
      path: req.originalUrl,
      method: req.method,
      status: res.statusCode,
      duration_ms: Number(end - start) / 1_000_000,
      subject: req.identity?.subject
    });
  });
  next();
});

app.use('/health', healthRoutes);

app.use(globalSwitchGuard);
app.use(rateLimitGuard);

app.use('/secrets', secretsRoutes);

app.post('/admin/reload', (_req, res) => {
  try {
    const config = refreshConfig();
    resetTokenValidator();
    writeAudit({ action: 'config_reloaded' });
    res.status(200).json({ message: 'Configuration reloaded', config });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reload configuration', detail: error.message });
  }
});

app.use((error, _req, res, _next) => {
  writeAudit({ action: 'error', message: error.message, stack: error.stack });
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
