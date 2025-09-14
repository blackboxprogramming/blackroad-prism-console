import fs from 'fs';
const RAG='knowledge/rag_packs.json';
const packs=fs.existsSync(RAG)? JSON.parse(fs.readFileSync(RAG,'utf-8')).packs||{}:{};
const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Knowledge RAG ${ym}\n\n`;
for(const [k,v] of Object.entries<any>(packs)){ md += `- ${k}: ${v.docs?.length||0} docs\n`; }
fs.mkdirSync('knowledge/reports',{recursive:true});
fs.writeFileSync(`knowledge/reports/KN_${ym}.md`, md);
console.log('rag report written');
