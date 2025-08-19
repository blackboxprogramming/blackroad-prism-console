import test from 'node:test';
import assert from 'node:assert';
import { Engine, nodeHandlers } from '../packages/lucidia-create/dist/index.js';

test('belt drops when full', () => {
  const nodes = [
    { id: 's1', type: 'Source', cfg: { value: 'A' } },
    { id: 's2', type: 'Source', cfg: { value: 'B' } },
    { id: 'b', type: 'Belt', cfg: { capacity: 1 } },
    { id: 'd', type: 'Depot', cfg: {} }
  ];
  const edges = [
    { from: { node: 's1', port: 'out' }, to: { node: 'b', port: 'in' } },
    { from: { node: 's2', port: 'out' }, to: { node: 'b', port: 'in' } },
    { from: { node: 'b', port: 'out' }, to: { node: 'd', port: 'in' } }
  ];
  const engine = new Engine(nodes, edges, nodeHandlers);
  engine.tick();
  const depot = nodes.find(n => n.id === 'd');
  assert.deepStrictEqual(depot.state.store, ['A']);
});

test('clutch gate contradictions', () => {
  const nodes = [
    { id: 's', type: 'Source', cfg: { value: 1 } },
    { id: 'g', type: 'ClutchGate', cfg: { state: -1 } },
    { id: 'd', type: 'Depot', cfg: {} }
  ];
  const edges = [
    { from: { node: 's', port: 'out' }, to: { node: 'g', port: 'in' } },
    { from: { node: 'g', port: 'out' }, to: { node: 'd', port: 'in' } }
  ];
  const engine = new Engine(nodes, edges, nodeHandlers);
  const res = engine.tick();
  assert.equal(res.contradictions.length, 1);
  const depot = nodes.find(n => n.id === 'd');
  assert.deepStrictEqual(depot.state?.store ?? [], []);
});
