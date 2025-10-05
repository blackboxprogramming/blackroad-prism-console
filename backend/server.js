const http = require('http');
const data = require('./data');

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

// Sample credentials for tests
const VALID_USER = {
  username: 'root',
  password: 'Codex2025', // pragma: allowlist secret
  token: 'test-token', // pragma: allowlist secret
};
const tasks = [];

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject();
      }
    });
  });
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

data.expireApprovedExceptions();
setInterval(() => {
  try {
    data.expireApprovedExceptions();
  } catch (err) {
    console.error('exception expiry failed', err); // eslint-disable-line no-console
  }
}, ONE_DAY_MS);

const app = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    try {
      const body = await parseBody(req);
      if (body.username === VALID_USER.username && body.password === VALID_USER.password) {
        return send(res, 200, { token: VALID_USER.token });
      }
      return send(res, 401, { error: 'invalid credentials' });
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/tasks') {
    if (req.headers.authorization !== `Bearer ${VALID_USER.token}`) {
      return send(res, 401, { error: 'unauthorized' });
    }
    try {
      const body = await parseBody(req);
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return send(res, 400, { error: 'invalid task' });
      }
      const task = { id: tasks.length + 1, title: body.title };
      tasks.push(task);
      return send(res, 201, { ok: true, task });
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/tasks') {
    if (req.headers.authorization !== `Bearer ${VALID_USER.token}`) {
      return send(res, 401, { error: 'unauthorized' });
    }
    return send(res, 200, { tasks });
  }

  if (req.method === 'POST' && url.pathname === '/exceptions') {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
    const ruleId = typeof body.rule_id === 'string' && body.rule_id.trim();
    const subjectType = typeof body.subject_type === 'string' && body.subject_type.trim();
    const subjectId = typeof body.subject_id === 'string' && body.subject_id.trim();
    const reason = typeof body.reason === 'string' && body.reason.trim();
    const orgId = safeNumber(body.org_id);
    const requestedBy = safeNumber(body.requested_by);
    if (!ruleId || !subjectType || !subjectId || !reason || orgId == null || requestedBy == null) {
      return send(res, 400, { error: 'invalid exception payload' });
    }
    const validUntil = body.valid_until || null;
    const created = data.createException({
      ruleId,
      orgId,
      subjectType,
      subjectId,
      requestedBy,
      reason,
      validUntil,
    });
    return send(res, 201, created);
  }

  if (req.method === 'POST' && segments[0] === 'exceptions' && segments.length === 3) {
    const exceptionId = safeNumber(segments[1]);
    if (exceptionId == null) {
      return send(res, 404, { error: 'not found' });
    }
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
    const actor = safeNumber(body.actor);
    if (actor == null) {
      return send(res, 400, { error: 'actor required' });
    }
    const note = typeof body.note === 'string' ? body.note : undefined;
    if (segments[2] === 'approve') {
      const approved = data.approveException(exceptionId, {
        actor,
        note,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
      });
      if (!approved) return send(res, 404, { error: 'not found' });
      return send(res, 200, approved);
    }
    if (segments[2] === 'deny') {
      const denied = data.denyException(exceptionId, { actor, note });
      if (!denied) return send(res, 404, { error: 'not found' });
      return send(res, 200, denied);
    }
    if (segments[2] === 'revoke') {
      const revoked = data.revokeException(exceptionId, { actor, note });
      if (!revoked) return send(res, 404, { error: 'not found' });
      return send(res, 200, revoked);
    }
  }

  if (req.method === 'GET' && url.pathname === '/exceptions') {
    const list = data.listExceptions({
      ruleId: url.searchParams.get('rule_id') || undefined,
      subjectType: url.searchParams.get('subject_type') || undefined,
      subjectId: url.searchParams.get('subject_id') || undefined,
      status: url.searchParams.get('status') || undefined,
    });
    return send(res, 200, { exceptions: list });
  }

  // invalid JSON catch-all
  if (req.method === 'POST') {
    try {
      await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
  }

  send(res, 404, { error: 'not found' });
});

module.exports = { app };

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://${HOST}:${PORT}`);
  });
}
