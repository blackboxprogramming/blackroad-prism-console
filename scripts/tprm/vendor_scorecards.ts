import fs from 'fs';
const V='tprm/vendors.json', R='tprm/risk.json'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const vendors=fs.existsSync(V)? JSON.parse(fs.readFileSync(V,'utf-8')).vendors||{}:{};
const risk=fs.existsSync(R)? JSON.parse(fs.readFileSync(R,'utf-8')).risks||{}:{};
let md=`# Vendor Scorecards ${ym}\n\n`;
for(const [id,v] of Object.entries<any>(vendors)){ const r=risk[id]?.dimensions||{}; const avg=r.security?(((r.security+r.privacy+r.financial+r.operational+r.compliance)/5).toFixed(2)):'n/a'; md+=`- ${id} (${v.name}): criticality=${v.criticality}, risk_avg=${avg}\n`; }
fs.mkdirSync('tprm/reports',{recursive:true}); fs.writeFileSync(`tprm/reports/SCORECARDS_${ym}.md`, md);
console.log('tprm scorecards written');
