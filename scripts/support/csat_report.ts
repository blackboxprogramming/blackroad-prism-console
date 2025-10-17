import fs from 'fs';
const C='data/support/csat.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let avg=0, n=0;
if (fs.existsSync(C)){ const rows=fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); rows.forEach((r:any)=>{ avg+=Number(r.rating||0); n++; }); }
avg = n? Number((avg/n).toFixed(2)) : 0;
const md=`# CSAT ${ym}\n\n- Responses: ${n}\n- Avg: ${avg}\n`;
fs.mkdirSync('support/reports',{recursive:true}); fs.writeFileSync(`support/reports/CSAT_${ym}.md`, md);
console.log('csat report written');
