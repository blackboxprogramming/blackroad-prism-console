const http = require('http');

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

const app = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/auth/login') {
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

  if (req.method === 'POST' && req.url === '/api/tasks') {
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
