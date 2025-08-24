import test from 'node:test';
import assert from 'node:assert';
import { loadAgent, sendMessage, recvMessage, saveLocalAgent, clearAgents, restoreAgents } from '../../frontend/src/localAgents.mjs';
import fs from 'fs';

test('echo agent responds and persists', async () => {
  clearAgents();
  const store = {};
  global.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = v;
    },
  };
  const manifest = JSON.parse(fs.readFileSync('frontend/src/wasm/echo.json', 'utf8'));
  const wasm = Buffer.from(manifest.wasm.split(',')[1], 'base64');
  await loadAgent(manifest, wasm);
  await saveLocalAgent({ id: manifest.name, manifest, wasm: Array.from(wasm) });
  sendMessage('echo', 'hi');
  assert.strictEqual(recvMessage('echo'), 'hi');
  clearAgents();
  await restoreAgents();
  sendMessage('echo', 'hello');
  assert.strictEqual(recvMessage('echo'), 'hello');
});
