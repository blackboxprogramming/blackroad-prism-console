import { openTicket } from '../apps/api/src/lib/support/ticket_pipeline.js';
import fetch from 'node-fetch';

async function main(){
  const incident = { summary:'Error spike in /api/health', description:'5xx above baseline; investigating' };
  await openTicket(incident, process.env);
  if(process.env.SLACK_WEBHOOK){
    await fetch(process.env.SLACK_WEBHOOK, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text:`Support ticket opened: ${incident.summary}`})});
  }
}
main().catch(e=>{ console.error(e); process.exit(0); });
