import assert from 'node:assert';
import { Engine, nodeHandlers } from '../packages/lucidia-create/dist/index.js';

const nodes = [
  { id: 's', type: 'Source', cfg: { value: 1 } },
  { id: 'b', type: 'Belt', cfg: { capacity: 2 } },
  { id: 'd', type: 'Depot', cfg: {} }
];

const edges = [
  { from: { node: 's', port: 'out' }, to: { node: 'b', port: 'in' } },
  { from: { node: 'b', port: 'out' }, to: { node: 'd', port: 'in' } }
];

const engine = new Engine(nodes, edges, nodeHandlers);
for (let i = 0; i < 3; i++) engine.tick();
const depot = nodes.find(n => n.id === 'd');
assert.deepStrictEqual(depot.state.store, [1, 1, 1]);
