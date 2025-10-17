import fs from 'fs';
const KG='knowledge/kg.json';
const o=fs.existsSync(KG)? JSON.parse(fs.readFileSync(KG,'utf-8')):{nodes:[],edges:[]};
fs.mkdirSync('knowledge/reports',{recursive:true});
fs.writeFileSync('knowledge/reports/KN_'+new Date().toISOString().slice(0,7).replace('-','')+'.md', `# Knowledge Graph\n\n- Nodes: ${(o.nodes||[]).length}\n- Edges: ${(o.edges||[]).length}\n`);
console.log('kg report written');
