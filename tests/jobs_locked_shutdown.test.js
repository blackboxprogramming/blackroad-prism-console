const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { EventEmitter } = require('events');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadWireChild() {
  const filePath = path.join(__dirname, '..', 'srv/blackroad-api/modules/jobs_locked.js');
  let code = fs.readFileSync(filePath, 'utf8');
  code += '\n;globalThis.wireChild = wireChild; globalThis.PROCS = PROCS;';
  const sandbox = {
    console,
    fetch: () => Promise.resolve(),
    require: (mod) => {
      if (mod === 'better-sqlite3') {
        return class FakeDB {
          prepare() {
            return {
              run() { return this; },
              all() { return []; },
              get() { return {}; },
            };
          }
        };
      }
      if (mod === 'uuid') {
        return { v4: () => 'stub-id' };
      }
      if (mod === 'yaml') {
        return { parse: () => ({}), stringify: () => '' };
      }
      return require(mod);
    },
    process: { ...process, env: { ...process.env, DB_PATH: ':memory:' } },
    module: { exports: {} },
    exports: {},
    __filename: filePath,
    __dirname: path.dirname(filePath),
  };
  vm.runInNewContext(code, sandbox, { filename: filePath });
  return { wireChild: sandbox.wireChild, PROCS: sandbox.PROCS };
}

test('wireChild resolves and cleans up even if onClose throws', async () => {
  const { wireChild, PROCS } = loadWireChild();
  const jobId = 'job-123';
  PROCS.set(jobId, {});
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();

  const origDelete = PROCS.delete.bind(PROCS);
  let deleteCalls = 0;
  PROCS.delete = (key) => {
    deleteCalls++;
    return origDelete(key);
  };

  let onCloseCalls = 0;
  function onClose() {
    onCloseCalls++;
    throw new Error('boom');
  }

  const promise = wireChild(jobId, child, onClose);
  child.emit('close', 0);
  await promise;

  assert.equal(onCloseCalls, 1);
  assert.equal(deleteCalls, 1);
  assert.ok(!PROCS.has(jobId));
});
