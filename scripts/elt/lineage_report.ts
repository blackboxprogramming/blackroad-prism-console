import fs from 'fs';
const L='elt/lineage.json'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const o=fs.existsSync(L)? JSON.parse(fs.readFileSync(L,'utf-8')):{nodes:[],edges:[]};
const md = `# Lineage ${ym}\n\n- Nodes: ${(o.nodes||[]).length}\n- Edges: ${(o.edges||[]).length}\n`;
fs.mkdirSync('elt/reports',{recursive:true}); fs.writeFileSync(`elt/reports/LINEAGE_${ym}.md`, md);
console.log('lineage report written');
