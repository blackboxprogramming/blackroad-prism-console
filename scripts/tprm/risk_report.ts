import fs from 'fs';
const R='tprm/risk.json'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const o=fs.existsSync(R)? JSON.parse(fs.readFileSync(R,'utf-8')).risks||{}:{};
let md=`# TPRM Risk ${ym}\n\n`;
for(const [vid,rec] of Object.entries<any>(o)){ const d=rec.dimensions||{}; const avg=((d.security+d.privacy+d.financial+d.operational+d.compliance)/5).toFixed(2); md+=`- ${vid}: avg=${avg}\n`; }
fs.mkdirSync('tprm/reports',{recursive:true}); fs.writeFileSync(`tprm/reports/RISK_${ym}.md`, md);
console.log('tprm risk report written');
