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

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'express') return mockExpress;
  if (request === '../db' || request.includes('db.js')) return {};
  if (request === '../auth' || request.includes('auth.js')) return { requireAuth: (_req, _res, next) => next() };
  if (request === '../rateLimiter' || request.includes('rateLimiter.js')) return { strictLimiter: (_req, _res, next) => next() };
  return originalLoad(request, parent, isMain);
};

require('../src/routes/subscribe.js');
Module._load = originalLoad;

const res = {
  body: null,
  json(obj) {
    this.body = obj;
  }
};

handlers['/subscribe/health']({}, res);
assert.deepStrictEqual(res.body, { status: 'ok' });

