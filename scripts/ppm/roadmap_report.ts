import fs from 'fs';
const R='portfolio/roadmaps.json'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Roadmap ${ym}`+"\n\n";
if(fs.existsSync(R)){ const o=JSON.parse(fs.readFileSync(R,'utf-8')).roadmaps||{}; Object.entries<any>(o).forEach(([k,v])=>{ md+=`## ${k} — ${v.name}\n`; (v.items||[]).forEach((i:any)=>{ md+=`- ${i.initiativeId} ${i.start}→${i.end} ${i.percent}%\n`; }); }); }
fs.mkdirSync('portfolio/reports',{recursive:true}); fs.writeFileSync(`portfolio/reports/ROADMAP_${ym}.md`, md);
console.log('roadmap report written');
