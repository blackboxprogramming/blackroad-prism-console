import fs from 'fs';
const S='data/ppm/status.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Portfolio Status ${ym}`+"\n\n";
if(fs.existsSync(S)){ const rows=fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-20);
  rows.forEach(r=>{ md+=`- ${r.initiativeId} ${r.period} RAG=${r.rag} ${r.progress_pct}%\n`; });
}
fs.mkdirSync('portfolio/reports',{recursive:true}); fs.writeFileSync(`portfolio/reports/STATUS_${ym}.md`, md);
console.log('status report written');
