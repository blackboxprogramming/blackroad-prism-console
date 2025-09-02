const assert = require('node:assert/strict');
const Module = require('module');

const handlers = {};
function mockExpress() {
  return {};
}
mockExpress.Router = function () {
  return {
    get(path, fn) {
      handlers[path] = fn;
    },
    use() {},
    post(path, fn) {
      handlers[`POST ${path}`] = fn;
    }
  };
};

function loadRouter(subEnabled) {
  // reset handlers for each load
  for (const k of Object.keys(handlers)) delete handlers[k];

  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'express') return mockExpress;
    if (request === '../db' || request.includes('db.js')) return {};
    if (request === '../auth' || request.includes('auth.js')) return { requireAuth: (_req, _res, next) => next() };
    if (request === '../rateLimiter' || request.includes('rateLimiter.js')) return { strictLimiter: (_req, _res, next) => next() };
    return originalLoad(request, parent, isMain);
  };

  if (subEnabled !== undefined) process.env.SUBSCRIPTIONS_ENABLED = subEnabled;
  delete require.cache[require.resolve('../src/routes/subscribe.js')];
  require('../src/routes/subscribe.js');
  Module._load = originalLoad;
  if (subEnabled !== undefined) delete process.env.SUBSCRIPTIONS_ENABLED;
}

function callHealth() {
  const res = {
    body: null,
    json(obj) {
      this.body = obj;
    }
  };
  handlers['/subscribe/health']({}, res);
  return res.body;
}

// health endpoint should respond regardless of subscriptions flag
loadRouter('true');
assert.deepStrictEqual(callHealth(), { status: 'ok' });

loadRouter('false');
assert.deepStrictEqual(callHealth(), { status: 'ok' });
