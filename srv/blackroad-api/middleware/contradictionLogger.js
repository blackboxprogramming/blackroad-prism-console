const crypto = require('crypto');
const { TernaryError } = require('../lib/ternaryError');
const { db } = require('../lib/db');

function safeStringify(body) {
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body ?? {});
  } catch (_err) {
    return '[unserializable]';
  }
}

function hashPayload(body) {
  const payload = safeStringify(body);
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

const insertStmt = db.prepare(
  `INSERT INTO error_contradictions
    (req_id, user_id, route, method, state, resolved, severity, code, message, stack, payload_hash, contradiction_hint)
   VALUES (@req_id, @user_id, @route, @method, @state, 0, @severity, @code, @message, @stack, @payload_hash, @contradiction_hint)`
);

function contradictionLogger(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const reqIdSource =
    req.headers['x-request-id'] ||
    (typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex'));
  const reqId = String(reqIdSource);
  const userId = req.user?.id ?? null;
  const route = req.route?.path || req.originalUrl || 'unknown';
  const method = req.method || 'UNKNOWN';
  const isTernary = err instanceof TernaryError;
  const state = isTernary ? err.state : -1;
  const code = isTernary ? err.code : err.code || 'E_THROW';
  const severity = isTernary ? err.severity : 'med';
  const hint = isTernary ? err.hint : null;
  const payloadHash = hashPayload(req.body);
  const stack = (err && err.stack ? String(err.stack) : '').slice(0, 8000);

  try {
    insertStmt.run({
      req_id: reqId,
      user_id: userId || null,
      route,
      method,
      state,
      severity,
      code: code || null,
      message: err && err.message ? String(err.message) : null,
      stack,
      payload_hash: payloadHash,
      contradiction_hint: hint || null,
    });
  } catch (logErr) {
    console.error('[contradictionLogger] failed to insert', logErr);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  const statusCandidate =
    (err && typeof err.status !== 'undefined' ? err.status : undefined) ??
    (err && typeof err.statusCode !== 'undefined' ? err.statusCode : undefined);
  const statusNumber = Number(statusCandidate);
  const status = Number.isInteger(statusNumber) && statusNumber >= 400 ? statusNumber : 500;

  res.status(status).json({
    ok: false,
    req_id: reqId,
    state,
    code: code || 'E_THROW',
    message: 'Internal error',
  });
}

module.exports = {
  contradictionLogger,
  hashPayload,
};
