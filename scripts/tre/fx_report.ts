import fs from 'fs';
const R='treasury/fx_rates.json'; const D='data/treasury/fx_deals.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const rates=fs.existsSync(R)? JSON.parse(fs.readFileSync(R,'utf-8')).rates||{}:{};
const deals=fs.existsSync(D)? fs.readFileSync(D,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
let md=`# FX ${ym}\n\n## Rates\n`; const lastDate=Object.keys(rates).sort().slice(-1)[0]; if(lastDate){ const pairs=rates[lastDate]; Object.entries<any>(pairs).forEach(([k,v])=>{ md+=`- ${k}: ${v}\n`; }); }
md+=`\n## Deals\n`; deals.slice(-10).forEach((d:any)=>{ md+=`- ${d.dealId} ${d.buy}/${d.sell} ${d.rate} notional=${d.notional}\n`; });
fs.mkdirSync('treasury/reports',{recursive:true}); fs.writeFileSync(`treasury/reports/FX_${ym}.md`, md);
console.log('fx report written');
