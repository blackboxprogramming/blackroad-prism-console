import fs from 'fs';
const C='data/ppm/capacity.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Capacity ${ym}`+"\n\n";
if(fs.existsSync(C)){ const rows=fs.readFileSync(C,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((r:any)=>r.period===ym);
  const teams:Record<string,number>={}, alloc:Record<string,number>={};
  rows.forEach(r=>{ (r.teams||[]).forEach((t:any)=>teams[t.team]=(teams[t.team]||0)+Number(t.capacity_pts||0)); (r.allocations||[]).forEach((a:any)=>alloc[a.team]=(alloc[a.team]||0)+Number(a.pts||0)); });
  Object.keys(teams).forEach(t=>{ md+=`- ${t}: cap=${teams[t]} alloc=${alloc[t]||0} rem=${(teams[t]-(alloc[t]||0))}\n`; });
}
fs.mkdirSync('portfolio/reports',{recursive:true}); fs.writeFileSync(`portfolio/reports/CAPACITY_${ym}.md`, md);
console.log('capacity report written');
