import fetch from 'node-fetch';
import { score } from '../apps/api/src/lib/health/score.js';

async function main(){
  // pull minimal signals (replace with real sources / warehouse)
  const usage30d = 80, incidents30d = 1, csat = 4.6, arAgingDays = 12;
  const s = score({ usage30d, incidents30d, csat, arAgingDays });
  const text = `Customer Health: score ${s}/100 | usage:${usage30d} incidents:${incidents30d} csat:${csat} ar:${arAgingDays}d`;
  if(process.env.SLACK_WEBHOOK){
    await fetch(process.env.SLACK_WEBHOOK, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
  } else { console.log(text); }
}
main().catch(e=>{ console.error(e); process.exit(0); });
