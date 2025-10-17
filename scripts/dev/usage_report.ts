
import fs from 'fs';
const M='data/dev/metering.jsonl';
const ym=new Date().toISOString().slice(0,7).replace('-','');
let total=0; const byKey:Record<string,number>={};
if (fs.existsSync(M)){
  const rows=fs.readFileSync(M,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  rows.forEach((r:any)=>{ total+=Number(r.units||1); byKey[r.key]=(byKey[r.key]||0)+Number(r.units||1); });
}
const md=`# API Usage ${ym}\n\n- Total units: ${total}\n` + Object.entries(byKey).map(([k,v])=>`- ${k}: ${v}`).join('\n') + '\n';
fs.mkdirSync('dev/reports',{recursive:true}); fs.writeFileSync(`dev/reports/USAGE_${ym}.md`, md);
console.log('usage report written');
