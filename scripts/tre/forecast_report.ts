import fs from 'fs';
const F='data/treasury/forecast.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
let md=`# Cash Forecast ${ym}\n\n`;
if (fs.existsSync(F)){ const last=fs.readFileSync(F,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).slice(-1)[0]; if(last){ md+=`- Horizon: ${last.horizon_days} days\n- Method: ${last.method}\n`; } }
fs.mkdirSync('treasury/reports',{recursive:true}); fs.writeFileSync(`treasury/reports/FORECAST_${ym}.md`, md);
console.log('forecast report written');
