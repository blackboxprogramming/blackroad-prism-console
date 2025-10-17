import fs from 'fs';
const C='data/elt/costs.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let compute=0, storage=0;
if (fs.existsSync(C)){
  const rows=fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  rows.forEach((r:any)=>{ if(String(r.period||'').slice(0,7)===ym) { compute+=Number(r.compute_cost||0); storage+=Number(r.storage_cost||0); } });
}
const md = `# ELT Costs ${ym}\n\n- Compute: ${compute}\n- Storage: ${storage}\n- Total: ${compute+storage}\n`;
fs.mkdirSync('elt/reports',{recursive:true}); fs.writeFileSync(`elt/reports/COSTS_${ym}.md`, md);
console.log('costs report written');
