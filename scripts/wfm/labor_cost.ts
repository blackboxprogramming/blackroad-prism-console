import fs from 'fs';
const TS='data/wfm/timesheets.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let total=0, lines=0;
if (fs.existsSync(TS)){
  const rows=fs.readFileSync(TS,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((r:any)=>r.period===ym);
  rows.forEach((r:any)=>{ const hrs=(r.lines||[]).reduce((s:number,l:any)=>s+Number(l.hours||0),0); total+=hrs; lines+= (r.lines||[]).length; });
}
const md=`# Labor Cost ${ym}\n\n- Timesheets: ${lines}\n- Hours: ${total}\n`;
fs.mkdirSync('wfm/reports',{recursive:true}); fs.writeFileSync(`wfm/reports/LABOR_${ym}.md`, md);
console.log('labor cost report written');
