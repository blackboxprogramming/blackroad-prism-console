import fs from 'fs';
const WO='data/fac/work_orders.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let open=0, done=0;
if (fs.existsSync(WO)) {
  const rows=fs.readFileSync(WO,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  open=rows.filter((r:any)=>r.state==='open'||r.state==='in_progress').length;
  done=rows.filter((r:any)=>r.state==='done').length;
}
const md=`# Maintenance ${ym}\n\n- Open/In Progress: ${open}\n- Done: ${done}\n`;
fs.mkdirSync('fac/reports',{recursive:true}); fs.writeFileSync(`fac/reports/MAINT_${ym}.md`, md);
console.log('maintenance report written');
