import fetch from 'node-fetch';
import { sign } from '../keys/sign.js';
type Delivery = { id:string; event:string; url:string; body:any; attempts:number; lastStatus?:number; lastError?:string; nextAt:number };
const QPATH = 'apps/api/webhooks_queue.json';
const LOGPATH = 'apps/api/webhooks_log.jsonl';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

function loadQ(): Delivery[] { return fs.existsSync(QPATH)? JSON.parse(fs.readFileSync(QPATH,'utf-8')):[]; }
function saveQ(v:Delivery[]){ fs.mkdirSync('apps/api',{recursive:true}); fs.writeFileSync(QPATH, JSON.stringify(v,null,2)); }

export function enqueue(url:string, event:string, body:any){
  const q = loadQ();
  q.push({ id: uuid(), event, url, body, attempts:0, nextAt: Date.now() });
  saveQ(q);
}

export async function runOnce(secret:string){
  const now = Date.now();
  const q = loadQ();
  const remaining: Delivery[] = [];
  for (const d of q) {
    if (d.nextAt > now) { remaining.push(d); continue; }
    try {
      const payload = JSON.stringify({ id: d.id, event: d.event, data: d.body, ts: Date.now() });
      const sig = sign(payload, secret);
      const res = await fetch(d.url, { method:'POST', headers:{'Content-Type':'application/json','x-br-sign':sig}, body: payload });
      fs.appendFileSync(LOGPATH, JSON.stringify({ ts: Date.now(), id:d.id, url:d.url, status: res.status })+'\n');
      if (res.status >= 200 && res.status < 300) continue;
      d.attempts += 1; d.lastStatus = res.status; d.nextAt = now + Math.min(600000, 2**d.attempts*1000); remaining.push(d);
    } catch(e:any){
      d.attempts += 1; d.lastError = e?.message; d.nextAt = now + Math.min(600000, 2**d.attempts*1000); remaining.push(d);
    }
  }
  saveQ(remaining);
}
