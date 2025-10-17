import { Router } from 'express';
import fs from 'fs';
const r = Router(); const BUD='finops/budgets.json', COST='data/finops/cost.jsonl', OUT='data/finops/budget_eval.jsonl';
const readB=()=> fs.existsSync(BUD)? JSON.parse(fs.readFileSync(BUD,'utf-8')):{ budgets:[] };
const writeB=(o:any)=>{ fs.mkdirSync('finops',{recursive:true}); fs.writeFileSync(BUD, JSON.stringify(o,null,2)); };
const cost=()=> fs.existsSync(COST)? fs.readFileSync(COST,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const append=(row:any)=>{ fs.mkdirSync('data/finops',{recursive:true}); fs.appendFileSync(OUT, JSON.stringify(row)+'\n'); };

r.post('/budgets/set',(req,res)=>{ const o=readB(); o.budgets.push(req.body||{}); writeB(o); res.json({ ok:true }); });

r.post('/budgets/evaluate',(req,res)=>{
  const period=String(req.body?.period||'');
  const budgets=readB().budgets||[];
  const rows=cost().filter((x:any)=>x.period===period);
  const evals:any[]=[];
  for(const b of budgets){
    const sum=rows.filter((x:any)=>{
      if(b.scope==='project') return x.project===b.key;
      if(b.scope==='cost_center') return x.cost_center===b.key || x.labels?.cost_center===b.key;
      return true;
    }).reduce((s:number,x:any)=>s+Number(x.cost||0),0);
    evals.push({ ts:Date.now(), period, scope:b.scope, key:b.key, amount:b.amount, actual: Number(sum.toFixed(2)), breach: sum>b.amount });
  }
  evals.forEach(e=>append(e));
  res.json({ ok:true, evaluations: evals });
});

export default r;
