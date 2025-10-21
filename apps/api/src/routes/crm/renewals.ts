
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/crm/renewals.jsonl', OPP='crm/opps.json';
const append=(row:any)=>{ fs.mkdirSync('data/crm',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };

r.post('/renewals/seed',(req,res)=>{ append({ ts:Date.now(), action:'seed', source:req.body?.from||'manual', period:req.body?.period||'' }); res.json({ ok:true }); });

r.post('/renewals/run',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const window=Number(process.env.CRM_RENEWAL_WINDOW_DAYS||120);
  const opps = fs.existsSync(OPP) ? JSON.parse(fs.readFileSync(OPP,'utf-8')).opps||{} : {};
  const soon = Object.values(opps).filter((o:any)=> (o.type==='renewal') && (new Date(o.close_date).getTime()-Date.now()) <= window*86400000 );
  const snapshot={ ts:Date.now(), period, due_within_days: window, count: soon.length, amount: soon.reduce((s:number,o:any)=>s+Number(o.amount||0),0) };
  append(snapshot); res.json({ ok:true, snapshot });
});

r.get('/renewals/recent',(req,res)=>{ const p=String(req.query.period||''); if(!fs.existsSync(FILE)) return res.json({ items:[] }); const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>!p||x.period===p).slice(-10); res.json({ items: rows }); });

export default r;

