import fs from 'fs';
const C='data/wfm/clock.jsonl'; const ymd=new Date().toISOString().slice(0,10).replace(/-/g,'');
let md=`# Attendance Exceptions ${ymd}\n\n`;
if (fs.existsSync(C)){
  const rows=fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  const today=rows.filter((r:any)=> new Date(r.ts).toISOString().slice(0,10)===new Date().toISOString().slice(0,10));
  const bySub:Record<string,number>= {}; today.forEach(r=>{ bySub[r.subjectId]=(bySub[r.subjectId]||0)+(r.type==='in'?1:-1); });
  Object.entries(bySub).forEach(([s,v])=>{ if(v!==0) md+=`- ${s}: unmatched punches\n`; });
}
fs.mkdirSync('wfm/reports',{recursive:true}); fs.writeFileSync(`wfm/reports/ATTN_${ymd}.md`, md);
console.log('attendance exceptions report written');
