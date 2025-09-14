
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const PLAN='crm/icm_plans.json', OPP='crm/opps.json', COMM='data/crm/commissions.jsonl';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const append=(row:any)=>{ fs.mkdirSync('data/crm',{recursive:true}); fs.appendFileSync(COMM, JSON.stringify(row)+'\n'); };

r.post('/icm/plan/set',(req,res)=>{ fs.mkdirSync('crm',{recursive:true}); fs.writeFileSync(PLAN, JSON.stringify(req.body||{},null,2)); res.json({ ok:true }); });

r.post('/icm/calc',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const plan=read(PLAN,{ planId:'default', base_rate: Number(process.env.CRM_COMMISSION_RATE||0.08), tiers:[] });
  const opp=read(OPP,{opps:{}}).opps||{};
  const closed=Object.values(opp).filter((o:any)=> (o.stage||'').toLowerCase().includes('closed-won') && String(o.close_date||'').slice(0,7)===period) as any[];
  const byOwner:Record<string,number>={};
  for(const o of closed){ byOwner[o.owner||'unknown']=(byOwner[o.owner||'unknown']||0)+Number(o.amount||0); }
  const lines=Object.entries(byOwner).map(([owner,amt])=>({ owner, amount:amt, commission: Number((amt*plan.base_rate).toFixed(2)) }));
  append({ ts:Date.now(), period, planId: plan.planId, lines });
  res.json({ ok:true, lines });
});

r.get('/icm/recent',(req,res)=>{ const p=String(req.query.period||''); if(!fs.existsSync(COMM)) return res.json({ items:[] }); const rows=fs.readFileSync(COMM,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!p||x.period===p).slice(-5); res.json({ items: rows }); });

export default r;

