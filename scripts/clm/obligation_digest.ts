import fs from 'fs';
const FILE='data/clm/obligations.jsonl';
const lines=fs.existsSync(FILE)?fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const items=lines.flatMap((r:any)=>(r.items||[]).map((i:any)=>({contractId:r.contractId,...i})));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const out=['# Obligations Digest',...items.map(i=>`- ${i.contractId} ${i.title} ${i.due} ${i.owner} ${i.status}`)];
fs.mkdirSync('clm/reports',{recursive:true});
fs.writeFileSync(`clm/reports/OBLIG_${ym}.md`, out.join('\n'));
