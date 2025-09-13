import { processLead } from '../apps/api/src/lib/revops/lead_pipeline.js';
import { processDeal } from '../apps/api/src/lib/revops/deal_pipeline.js';
import fetch from 'node-fetch';

async function main(){
  const leads = [{ email:'lead@example.com', source:'web', props:{ utm_campaign:'launch' } }];
  for(const l of leads){ await processLead(l, process.env); }
  await processDeal({ name:'BlackRoad Pro', amount:1200, stage:'qualified' }, process.env);
  if(process.env.SLACK_WEBHOOK){
    await fetch(process.env.SLACK_WEBHOOK, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text:'GTM nightly sync complete'})});
  }
}
main().catch(e=>{ console.error(e); process.exit(0); });
