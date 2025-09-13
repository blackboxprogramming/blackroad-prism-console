import fs from 'fs';
import yaml from 'yaml';
const files = ['warehouse/models/finance.yaml','warehouse/models/support.yaml','warehouse/models/growth.yaml'].filter(f=>fs.existsSync(f));
const nodes = new Set<string>(); const edges: [string,string][]= [];
for (const f of files){
  const y = yaml.parse(fs.readFileSync(f,'utf-8'));
  for (const m of (y.models||[])){
    nodes.add(m.name);
    for (const s of (m.sources||[])){ nodes.add(s); edges.push([s,m.name]); }
  }
}
const graph = { nodes: Array.from(nodes).map(id=>({id})), edges };
fs.mkdirSync('warehouse/lineage',{recursive:true});
fs.writeFileSync('warehouse/lineage/graph.json', JSON.stringify(graph,null,2));
console.log('lineage graph built');
