import test from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';

async function load(name) {
  const txt = await fs.readFile(`apps/orchestrator/components/ponder/examples/${name}.json`, 'utf-8');
  return JSON.parse(txt);
}

test('pipeline tutorial loads', async () => {
  const tut = await load('pipeline');
  assert.ok(Array.isArray(tut.steps) && tut.steps.length > 0);
});

test('contradiction tutorial loads', async () => {
  const tut = await load('contradiction');
  assert.equal(tut.steps[0].animate.props.state, -1);
});
