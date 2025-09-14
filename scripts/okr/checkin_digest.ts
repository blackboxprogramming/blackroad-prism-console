import fs from 'fs';
const C='data/okr/checkins.jsonl';
const now=new Date(); const ww=Math.ceil(((((now as any)-new Date(now.getFullYear(),0,1)))/86400000)+new Date(now.getFullYear(),0,1).getDay()+1)/7);
let md=`# OKR Digest ${now.getFullYear()}W${String(ww).padStart(2,'0')}`+"\n\n";
if(fs.existsSync(C)){ const rows=fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); const last=rows.slice(-10); last.forEach(r=>{ md+=`- ${r.objectiveId} score=${r.score} conf=${r.confidence}\n`; }); }
fs.mkdirSync('okr/reports',{recursive:true}); fs.writeFileSync(`okr/reports/OKR_${now.getFullYear()}${String(ww).padStart(2,'0')}.md`, md);
console.log('okr digest written');
