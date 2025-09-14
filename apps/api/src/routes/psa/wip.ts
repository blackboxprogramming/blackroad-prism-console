import { Router } from 'express';
import fs from 'fs';
const r = Router(); const TIME='data/psa/time.jsonl', WIP='data/psa/wip.jsonl', PROJ='psa/projects.json', RATES='psa/rates.json';
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const wjson=(p:string)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):{};

r.post('/wip/calc',(req,res)=>{
  const projectId=String(req.body?.projectId||''); const thru=String(req.body?.thru||new Date().toISOString().slice(0,10));
  const time=read(TIME).filter((t:any)=>t.projectId===projectId && t.date<=thru);
  const rates=wjson(RATES).rates||{roles:{},users:{}};
  const proj=wjson(PROJ).projects?.[projectId]||{bill_model:'T&M'};
  let amount=0; for(const t of time){ const base = (rates.users?.[t.userId]?.rate) ?? (rates.roles?.[t.role]?.rate) ?? Number(process.env.PSA_DEFAULT_RATE||150); amount += Number(t.hours||0)*base; }
  const out={ ts:Date.now(), projectId, thru, model:proj.bill_model||'T&M', unbilled: Number(amount.toFixed(2)) };
  fs.mkdirSync('data/psa',{recursive:true}); fs.appendFileSync(WIP, JSON.stringify(out)+'\n');
  res.json({ ok:true, wip: out });
});

export default r;
