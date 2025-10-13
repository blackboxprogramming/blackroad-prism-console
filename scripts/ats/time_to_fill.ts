import fs from 'fs';
const A='data/ats/applications.jsonl', O='data/ats/offers.jsonl';
const ym=new Date().toISOString().slice(0,7).replace('-','');
if(!fs.existsSync(A)||!fs.existsSync(O)) { console.log('no data'); process.exit(0); }
const apps=fs.readFileSync(A,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const offs=fs.readFileSync(O,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((o:any)=>o.state==='accepted');
let total=0, n=0;
offs.forEach((o:any)=>{ const a=apps.find((x:any)=>x.appId===o.appId); if(a){ const days=Math.round((o.ts - a.ts)/86400000); total+=days; n++; } });
const avg = n? (total/n).toFixed(1) : '0.0';
const md=`# Time to Fill ${ym}\n\n- Hires: ${n}\n- Avg days: ${avg}\n`;
fs.mkdirSync('ats/reports',{recursive:true}); fs.writeFileSync(`ats/reports/TTF_${ym}.md`, md);
console.log('ats ttf report written');
