const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const prism = require('../prism/prismsh.js');

// spawn all agents once for tests
const agents = prism.spawnElite();

for (const name of agents) {
  test(`ping ${name}`, () => {
    const res = prism.ping(name);
    assert.equal(res, `pong: ${name}`);
  });
}

test('analyze writes logs', () => {
  const dummy = path.join(__dirname, 'tmp', 'dummy.txt');
  fs.mkdirSync(path.dirname(dummy), { recursive: true });
  fs.writeFileSync(dummy, 'foo');
  for (const name of agents) {
    prism.analyze(name, dummy);
    const logPath = path.join(__dirname, '..', 'prism', 'logs', `${name}.log`);
    const content = fs.readFileSync(logPath, 'utf8');
    assert.ok(content.includes('analyze:'));
  }
});

test('codegen stub output', () => {
  for (const name of agents) {
    const out = prism.codegen(name, 'spec');
    assert.equal(typeof out, 'string');
    assert.ok(out.includes('spec'));
  }
});
