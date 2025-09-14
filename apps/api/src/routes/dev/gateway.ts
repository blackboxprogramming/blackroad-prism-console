
import { Router } from 'express';
import fs from 'fs';
const r = Router();
const APIS='dev/apis.json', KEYS='data/dev/keys.jsonl', SUB='dev/subscriptions.json', RL='data/dev/ratelimits.json', LOG='data/dev/gw_logs.jsonl', MTR='data/dev/metering.jsonl';
const apis=()=> fs.existsSync(APIS)? JSON.parse(fs.readFileSync(APIS,'utf-8')).apis||{}:{};
const keys=()=> fs.existsSync(KEYS)? fs.readFileSync(KEYS,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const subs=()=> fs.existsSync(SUB)? JSON.parse(fs.readFileSync(SUB,'utf-8')).subs||{}:{};
const rlRead=()=> fs.existsSync(RL)? JSON.parse(fs.readFileSync(RL,'utf-8')):{};
const rlWrite=(o:any)=>{ fs.mkdirSync('data/dev',{recursive:true}); fs.writeFileSync(RL, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/dev',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

function rateAllowed(token:string, rpm:number, burst:number){
  const now=Date.now(); const bucket=Math.floor(now/60000); const store=rlRead(); store[token]=store[token]||{};
  const b=store[token][bucket]||{count:0};
  if(b.count >= rpm + burst) return false;
  b.count++; store[token][bucket]=b; rlWrite(store); return true;
}

r.post('/gw/proxy',(req,res)=>{
  const { api, path, method, key } = req.body||{};
  const apiRec=apis()[api]; if(!apiRec) return res.status(404).json({ error:'api_not_found' });
  const row=(keys().reverse().find((k:any)=>k.token===key) || null);
  if(!row || row.revoked) return res.status(403).json({ error:'invalid_key' });
  const sub=subs()[key]||{ plan_id:'__default' };
  const plan= (fs.existsSync('dev/plans.json')? JSON.parse(fs.readFileSync('dev/plans.json','utf-8')).plans||[]:[]).find((p:any)=>p.id===sub.plan_id) || {rate_limit_rpm:Number(process.env.DEV_GW_DEFAULT_RPM||100),burst:Number(process.env.DEV_GW_DEFAULT_BURST||50),quota_month:100000};
  if(!rateAllowed(key, plan.rate_limit_rpm, plan.burst)) return res.status(429).json({ error:'rate_limited' });
  append(LOG,{ ts:Date.now(), api, path, method, key, plan: sub.plan_id, status:200 });
  append(MTR,{ ts:Date.now(), key, api, units:1 });
  res.json({ ok:true, upstream: `${apiRec.base_path}${path}`, status:200, data:{ message:'stubbed response' } });
});

r.get('/gw/logs',(req,res)=>{
  const since=Number(req.query.since_ts||0);
  const items= fs.existsSync(LOG)? fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!since || (x.ts>=since)).slice(-500):[];
  res.json({ items });
});

r.post('/meter/record',(req,res)=>{ append(MTR,{ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });

export default r;
