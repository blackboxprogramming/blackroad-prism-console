import fs from 'fs';
const S='data/mkt/spend.jsonl', A='data/mkt/attribution_results.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const spend=fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>x.period===ym):[];
const attr=fs.existsSync(A)? JSON.parse((fs.readFileSync(A,'utf-8').trim().split('\n').filter(Boolean)).slice(-1)[0]||'{"byCampaign":{}}'):{byCampaign:{}};
let md=`# ROAS ${ym}\n\n`;
const byCamp:any={}; spend.forEach((s:any)=>{ byCamp[s.campaignId]=(byCamp[s.campaignId]||0)+Number(s.amount||0); });
for(const [camp,amt] of Object.entries<any>(byCamp)){ const attrib=attr.byCampaign?.[camp]||0; const roas=amt? (attrib/amt).toFixed(3):'0'; md+=`- ${camp}: spend=${amt} attributed=${attrib} ROAS=${roas}\n`; }
fs.mkdirSync('mkt/reports',{recursive:true}); fs.writeFileSync(`mkt/reports/ROAS_${ym}.md`, md);
console.log('roas report written');
