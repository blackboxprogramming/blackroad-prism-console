import fs from 'fs';
import fetch from 'node-fetch';

type Row = { id:string; due_at:string; total:number; paid?:boolean; dunning_stage?:string };

function stageFor(daysPast: number) {
  if (daysPast < 1) return 'NONE';
  if (daysPast < 7) return 'D1';
  if (daysPast < 14) return 'D2';
  if (daysPast < 21) return 'D3';
  return 'FINAL';
}

async function postSlack(text: string) {
  if (!process.env.SLACK_WEBHOOK) return;
  await fetch(process.env.SLACK_WEBHOOK, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
}

const files = fs.readdirSync('invoices').filter(f=>f.endsWith('.json'));
(async ()=>{
  for(const f of files){
    const inv: Row = JSON.parse(fs.readFileSync(`invoices/${f}`,'utf-8'));
    if (inv.paid) continue;
    const days = Math.floor((Date.now() - Date.parse(inv.due_at)) / 86400000);
    const stage = stageFor(days);
    if (stage !== 'NONE' && inv.dunning_stage !== stage) {
      inv.dunning_stage = stage;
      fs.writeFileSync(`invoices/${f}`, JSON.stringify(inv,null,2));
      await postSlack(`Dunning ${stage}: ${inv.id} is ${days}d past due ($${inv.total})`);
      // Optional email webhook
      if (process.env.DUNNING_EMAIL_WEBHOOK) {
        await fetch(process.env.DUNNING_EMAIL_WEBHOOK, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ invoice: inv, stage }) });
      }
    }
  }
  console.log('Dunning pass complete');
})().catch(e=>{ console.error(e); process.exit(0); });
