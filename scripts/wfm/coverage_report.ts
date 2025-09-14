import fs from 'fs';
const R='data/wfm/rosters.jsonl';
const now=new Date(); const ww=Math.ceil(((((now as any)-new Date(now.getFullYear(),0,1)))/86400000)+new Date(now.getFullYear(),0,1).getDay()+1)/7);
let md=`# Coverage ${now.getFullYear()}W${String(ww).padStart(2,'0')}\n\n`;
if (fs.existsSync(R)){
  const rows=fs.readFileSync(R,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-20);
  rows.forEach(r=>{ md+=`- ${r.teamId} ${r.date}: ${r.assignments?.length||0} assignments\n`; });
}
fs.mkdirSync('wfm/reports',{recursive:true}); fs.writeFileSync(`wfm/reports/COVERAGE_${now.getFullYear()}${String(ww).padStart(2,'0')}.md`, md);
console.log('coverage report written');
