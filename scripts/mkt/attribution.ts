import fs from 'fs';
const R='data/mkt/attribution_results.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Attribution ${ym}\n\n`;
if (fs.existsSync(R)){
  const rows=fs.readFileSync(R,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  const last=rows.slice(-1)[0]; if(last){ md+=`Model: ${last.model}\n\n`; for (const [k,v] of Object.entries<any>(last.byCampaign||{})){ md+=`- ${k}: ${v}\n`; } }
}
fs.mkdirSync('mkt/reports',{recursive:true}); fs.writeFileSync(`mkt/reports/ATTR_${ym}.md`, md);
console.log('attribution report written');
