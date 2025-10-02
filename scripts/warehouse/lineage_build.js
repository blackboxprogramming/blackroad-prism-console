const fs = require('fs');
const yaml = require('yaml');

const files = [
  'warehouse/models/finance.yaml',
  'warehouse/models/support.yaml',
  'warehouse/models/growth.yaml'
].filter((file) => fs.existsSync(file));

const nodes = new Set();
const edges = [];

for (const file of files) {
  const doc = yaml.parse(fs.readFileSync(file, 'utf-8'));
  for (const model of doc.models || []) {
    nodes.add(model.name);
    for (const source of model.sources || []) {
      nodes.add(source);
      edges.push([source, model.name]);
    }
  }
}

const graph = {
  nodes: Array.from(nodes).map((id) => ({ id })),
  edges
};

fs.mkdirSync('warehouse/lineage', { recursive: true });
fs.writeFileSync('warehouse/lineage/graph.json', JSON.stringify(graph, null, 2));

console.log('lineage graph built');
