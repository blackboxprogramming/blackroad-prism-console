import { Router } from 'express';
import fs from 'fs';
const r = Router(); const D='treasury/debt.json', DR='data/treasury/debt_draws.jsonl', IN='data/treasury/debt_interest.jsonl';
const dread=()=> fs.existsSync(D)? JSON.parse(fs.readFileSync(D,'utf-8')):{ facilities:{} };
const dwrite=(o:any)=>{ fs.mkdirSync('treasury',{recursive:true}); fs.writeFileSync(D, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/treasury',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/debt/facility/upsert',(req,res)=>{ const o=dread(); const v=req.body||{}; o.facilities[v.facilityId]=v; dwrite(o); res.json({ ok:true }); });
r.post('/debt/draw',(req,res)=>{ append(DR,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/debt/interest/calc',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const draws=lines(DR).filter((x:any)=>String(x.date||'').slice(0,7)<=period);
  const total=draws.reduce((s:number,x:any)=>s+Number(x.amount||0)*0.01/12,0); // stub 1% monthly
  const row={ ts:Date.now(), period, interest:Number(total.toFixed(2)) };
  append(IN,row); res.json({ ok:true, row });
});
r.get('/debt/facility/:facilityId',(req,res)=>{ res.json(dread().facilities[String(req.params.facilityId)]||null); });
export default r;
