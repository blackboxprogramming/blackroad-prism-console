const SECRET_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
  'api-key',
  'apikey',
  'client-secret',
  'session',
  'signature',
  'bearer',
];

function shouldRedact(key = '') {
  const normalized = String(key).toLowerCase();
  return SECRET_KEYS.some((secret) => normalized.includes(secret));
}

function truncateString(value, max = 2048) {
  if (typeof value !== 'string') return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function clone(value) {
  if (Array.isArray(value)) return value.map((item) => clone(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, clone(v)])
    );
  }
  return value;
}

function redactValue(value, depth = 0, { maxDepth = 4 } = {}) {
  if (value == null) return value;
  if (depth >= maxDepth) return '[Truncated]';

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1, { maxDepth }));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        shouldRedact(k) ? '[REDACTED]' : redactValue(v, depth + 1, { maxDepth }),
      ])
    );
  }

  if (typeof value === 'string') {
    return truncateString(value, 1024);
  }

  return value;
}

function redactHeaders(headers = {}) {
  const normalized = clone(headers) || {};
  return Object.fromEntries(
    Object.entries(normalized).map(([k, v]) => [
      k,
      shouldRedact(k) ? '[REDACTED]' : String(v),
    ])
  );
}

function redactPayload(payload) {
  if (payload == null) return payload;
  if (typeof payload === 'string') {
    return truncateString(payload, 1024);
  }
  if (Buffer.isBuffer(payload)) {
    return truncateString(payload.toString('utf8'), 1024);
  }
  if (typeof payload === 'object') {
    return redactValue(payload);
  }
  return payload;
}

function buildPinoRedactPaths(extra = []) {
  const basePaths = [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers["set-cookie"]',
    'req.body.password',
    'req.body.token',
    'req.body.secret',
    'req.body.client_secret',
    'res.headers["set-cookie"]',
  ];
  return [...basePaths, ...extra];
}

module.exports = {
  SECRET_KEYS,
  shouldRedact,
  redactHeaders,
  redactPayload,
  redactValue,
  truncateString,
  buildPinoRedactPaths,
};
