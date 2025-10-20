import { Router } from 'express';
import fs from 'fs';
const r = Router(); const CFG='obs/alerts.json', OUT='data/obs/alerts.jsonl', MET='data/obs/metrics.jsonl';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/obs',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/alerts/set',(req,res)=>{ write(CFG, req.body||{rules:[]}); res.json({ ok:true }); });

r.post('/alerts/run',(req,res)=>{
  const rules=(read(CFG,{rules:[]}).rules||[]) as any[];
  const metrics=lines(MET).slice(-1000);
  let count=0;
  for(const rule of rules){
    const m = metrics.filter((x:any)=>x.service===rule.service)
      .flatMap((x:any)=> (x.points||[]).filter((p:any)=> rule.expr.startsWith('latency') ? p.name==='latency_p95' : p.name==='availability')
      .map((p:any)=>p.value));
    if(!m.length) continue;
    const cur = rule.expr.startsWith('latency') ? m[m.length-1] : (m[m.length-1]*100);
    const cond = rule.expr.startsWith('latency') ? (cur > rule.threshold) : (cur < rule.threshold);
    if(cond){ append(OUT,{ ts:Date.now(), ruleId:rule.id, service:rule.service, value:cur, severity:rule.severity, route:rule.route }); count++; }
  }
  res.json({ ok:true, count });
});

r.get('/alerts/recent',(_req,res)=>{ const items=lines(OUT).reverse().slice(0,100); res.json({ items }); });

export default r;
