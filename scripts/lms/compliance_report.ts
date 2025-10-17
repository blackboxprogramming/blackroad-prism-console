import fs from 'fs';
const CMP='data/lms/compliance.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let last={pct:0,total:0,done:0};
if(fs.existsSync(CMP)){ const rows=fs.readFileSync(CMP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); last=rows.slice(-1)[0]||last; }
const md=`# LMS Compliance ${ym}\n\n- Completed: ${last.done}/${last.total}\n- Percent: ${last.pct}%\n`;
fs.mkdirSync('lms/reports',{recursive:true}); fs.writeFileSync(`lms/reports/COMPLIANCE_${ym}.md`, md);
console.log('lms compliance report written');
