const pinoHttp = require('pino-http');
const { redactHeaders, redactPayload, truncateString } = require('../lib/redact');

const DEFAULT_IGNORE = new Set([
  '/',
  '/health',
  '/health/live',
  '/health/ready',
  '/api/health',
]);

function normalizeHeaders(headers = {}) {
  if (!headers || typeof headers !== 'object') return {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, value])
  );
}

function snapshotRequest(req) {
  return {
    id: req.id || req.headers['x-request-id'],
    method: req.method,
    path: req.originalUrl || req.url,
    headers: redactHeaders(normalizeHeaders(req.headers)),
    body:
      req.body && Object.keys(req.body).length > 0
        ? redactPayload(req.body)
        : req.rawBody
          ? truncateString(req.rawBody, 1024)
          : undefined,
  };
}

function snapshotResponse(res) {
  let headers = {};
  if (typeof res.getHeaders === 'function') {
    headers = res.getHeaders();
  }
  return {
    statusCode: res.statusCode,
    headers: redactHeaders(headers),
  };
}

module.exports = function attachDebugProbes({ app, logger, enabled = false } = {}) {
  if (!app || !logger) {
    throw new Error('attachDebugProbes requires { app, logger }');
  }

  const httpLogger = pinoHttp({
    logger,
    autoLogging: {
      ignorePaths: Array.from(DEFAULT_IGNORE),
    },
    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps(req, res) {
      return {
        requestId: res.getHeader('X-Request-ID') || req.id,
      };
    },
    serializers: {
      req(req) {
        return snapshotRequest(req);
      },
      res(res) {
        return snapshotResponse(res);
      },
      err(err) {
        if (!err) return err;
        return {
          type: err.name,
          message: err.message,
          stack: err.stack,
        };
      },
    },
  });

  app.use(httpLogger);

  if (!enabled) return;

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      logger.debug({
        event: 'http_probe',
        durationMs: Number(durationMs.toFixed(3)),
        request: snapshotRequest(req),
        response: snapshotResponse(res),
      });
    });
    next();
  });
};
